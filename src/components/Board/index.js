import React, { PureComponent } from 'react'
import debounce from 'lodash/debounce'
import BoardTools from "./BoardTools"
import './index.scss'

class Board extends PureComponent {
  state = {
    coordinate: { originalX: 0, originalY: 0, upX: 0, upY: 0, x: 0, y: 0 },
    canvas: { ctx: null, width: 0, height: 0 },
    startDrawLine: false,
    store: [],
    lastIndex: 0,
    cursor: 'pen',
    styles: {
      color: { rgb: { r: 0, g: 0, b: 0, a: 1 } },
      strokeWidth: 1,
      lineCap: 'round',
      lineJoin: 'round'
    },
    svgElements: { rect: {}, ellipse: {}, path: {} }
  }

  constructor (props) {
    super(props)
    this.boardContainer = React.createRef()
    this.canvas = React.createRef()
    this.svg = React.createRef()
  }

  getContext () {
    const { current } = this.canvas
    const ctx = current.getContext('2d')
    this.setState((prevState) => {
      const { width, height } = prevState.canvas
      return { canvas: { ctx, width, height } }
    })
  }

  resize () {
    const { clientWidth, clientHeight } = this.boardContainer.current
    const canvas = this.canvas.current
    const svg = this.svg.current
    // 设置canvas的width和height
    canvas.width = clientWidth
    canvas.height = clientHeight
    canvas.style.width = `${clientWidth}px`
    canvas.style.height = `${clientHeight}px`
    // 设置svg的width和height
    svg.setAttribute('width', clientWidth)
    svg.setAttribute('height', clientHeight)
    svg.setAttribute('viewBox', `0 0 ${clientWidth} ${clientHeight}`)
    this.setState(prevState => {
      const { ctx } = prevState.canvas
      return { canvas: { ctx, width: clientWidth, height: clientHeight } }
    })
  }

  handleDown (event) {
    const { canvas: { ctx }, cursor, styles: { lineCap, lineJoin } } = this.state
    const { offsetX, offsetY } = event
    let state = {
      coordinate: { ...this.state.coordinate, originalX: offsetX, originalY: offsetY },
      startDrawLine: true
    }
    ctx.lineCap = lineCap
    ctx.lineJoin = lineJoin

    switch (cursor) {
      case "pen":
        state = {
          ...state,
          svgElements: {
            ...this.state.svgElements,
            path: { d: `M ${offsetX} ${offsetY}`, list: [{ x: offsetX, y: offsetY }], hide: true }
          }
        }
        break
      case "square":
        state = {
          ...state,
          svgElements: { ...this.state.svgElements, rect: { x: offsetX, y: offsetY, width: 0, height: 0, hide: true } }
        }
        break
      case 'circle':
        state = {
          ...state,
          svgElements: {
            ...this.state.svgElements,
            ellipse: { x: offsetX, y: offsetY, rx: 0, ry: 0, hide: true }
          }
        }
        break
      default:
        break
    }
    this.setState(state)
  }

  handleMove (e) {
    const { offsetX, offsetY, shiftKey } = e
    const { coordinate: { originalX, originalY }, canvas: { ctx }, startDrawLine, cursor } = this.state
    if (startDrawLine) {
      switch (cursor) {
        case 'pen':
          let x = Math.abs(offsetX - originalX)
          let y = Math.abs(offsetY - originalY)
          this.setState(prevState => {
            let { svgElements: { path: { d, list } } } = prevState
            const { length } = list
            const last = list[length - 1]
            if (shiftKey) {
              d = `${d} ${x >= y ? 'H ' + offsetX : ('V ' + offsetY)}`
              list.push({ x: x >= y ? offsetX : last.x, y: x >= y ? last.y : offsetY })
            } else {
              d = `${d} L ${offsetX} ${offsetY}`
              list.push({ x: offsetX, y: offsetY })
            }
            return {
              ...prevState, svgElements: {
                ...prevState.svgElements, path: { d, list, hide: false }
              }
            }
          })
          break
        case 'eraser':
          ctx.clearRect(offsetX, offsetY, 10, 10)
          break
        case 'square':
          this.setState(prevState => {
            let rect = prevState.svgElements.rect
            const width = offsetX - originalX
            const height = offsetY - originalY
            if (shiftKey) {
              rect = {
                x: width >= 0 ? originalX : (originalX + width),
                y: height >= 0 ? originalY : (originalY + width),
                width: Math.abs(width),
                height: Math.abs(width),
                hide: false
              }
            } else {
              rect = {
                x: width >= 0 ? originalX : (originalX + width),
                y: height >= 0 ? originalY : (originalY + height),
                width: Math.abs(width),
                height: Math.abs(height),
                hide: false
              }
            }
            return {
              svgElements: { ...prevState.svgElements, rect }
            }
          })
          break
        case 'circle':
          this.setState(prevState => {
            let ellipse = prevState.svgElements.ellipse
            const w = offsetX - originalX
            const h = offsetY - originalY
            let x = originalX + w / 2
            let y = originalY + h / 2
            let rx = Math.abs(w) / 2
            let ry = Math.abs(h) / 2
            if (shiftKey) {
              ellipse = { x, y, rx, ry: rx, hide: false }
            } else {
              ellipse = { x, y, rx, ry, hide: false }
            }
            return {
              svgElements: { ...prevState.svgElements, ellipse }
            }
          })
          break
        default:
          break
      }
    }
  }

  handleUp (event) {
    const { offsetX, offsetY, shiftKey } = event
    const { coordinate: { originalX, originalY }, canvas: { ctx }, lastIndex, store, cursor } = this.state
    const { length } = store
    let w = 0, h = 0
    switch (cursor) {
      case "pen":
        const { svgElements: { path: { list } } } = this.state
        ctx.beginPath()
        list.forEach(({ x, y }, index) => {
          console.log(x, y, index)
          if (index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.stroke()
        this.setState(prevState => {
          const { svgElements: { path } } = prevState
          path.hide = true
          return { svgElements: { ...prevState.svgElements, path } }
        })
        break
      case 'square':
        w = offsetX - originalX
        h = offsetY - originalY
        ctx.beginPath()
        if (shiftKey) {
          ctx.strokeRect(originalX, originalY, w, w)
        } else {
          ctx.strokeRect(originalX, originalY, w, h)
        }
        this.setState(prevState => {
          const { svgElements: { rect } } = prevState
          rect.hide = true
          return {
            svgElements: { ...prevState.svgElements, rect }
          }
        })
        ctx.stroke()
        break
      case 'circle':
        w = offsetX - originalX
        h = offsetY - originalY
        let x = originalX + w / 2
        let y = originalY + h / 2
        let rx = Math.abs(w) / 2
        let ry = Math.abs(h) / 2
        ctx.beginPath()
        if (shiftKey) {
          ctx.arc(x, y, rx, 0, Math.PI * 2)
        } else {
          ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
        }
        this.setState(prevState => {
          const { svgElements: { ellipse } } = prevState
          ellipse.hide = true
          return {
            svgElements: { ...prevState.svgElements, ellipse }
          }
        })
        ctx.stroke()
        break
      default:
        break
    }
    // 如果执行过撤回后，再次进行绘画，就将已撤回的历史快照移除
    if (lastIndex > 0) {
      store.splice(length - lastIndex, lastIndex)
    }
    const img = new Image()
    img.src = this.canvas.current.toDataURL()
    this.setState(prevState => {
      return {
        coordinate: { ...prevState.coordinate, upX: offsetX, upY: offsetY },
        store: [...store, img],
        lastIndex: 0,
        startDrawLine: false
      }
    })
    ctx.save()
  }

  clearBoard () {
    console.log('清空board')
    const { ctx, width, height } = this.state.canvas
    ctx.clearRect(0, 0, width, height)
  }

  undo () {
    console.log("撤销")
    const { canvas: { ctx }, lastIndex, store } = this.state
    const { length } = store
    this.clearBoard()
    if (length > 0) {
      const index = length - lastIndex - 2
      if (index > -2) {
        const img = store.slice(index, index + 1)
        if (img.length) {
          ctx.drawImage(...img, 0, 0)
        }
      }
      this.setState(prevState => {
        return { lastIndex: Math.min(prevState.lastIndex + 1, length) }
      })
    }
  }

  redo () {
    console.log("取消撤销")
    const { canvas: { ctx }, lastIndex, store } = this.state
    const { length } = store
    this.clearBoard()
    if (length > 0) {
      const index = length - lastIndex
      if (index <= length) {
        const img = store.slice(index, index + 1)
        if (img.length) {
          ctx.drawImage(...img, 0, 0)
        }
      }
      this.setState(prevState => {
        return { lastIndex: Math.max(prevState.lastIndex - 1, 0) }
      })
    }
  }

  setColor (color) {
    const { ctx } = this.state.canvas
    const { rgb: { r, g, b, a } } = color
    ctx.strokeStyle = `rgba(${r},${g},${b},${a})`
    this.setState({
      styles: { ...this.state.styles, color }
    })
  }

  setSize (strokeWidth) {
    const { ctx } = this.state.canvas
    ctx.strokeWidth = strokeWidth
    ctx.lineWidth = strokeWidth
    this.setState({
      styles: { ...this.state.styles, strokeWidth }
    })
  }

  exportFile () {
    const canvas = this.canvas.current
    const url = canvas.toDataURL()
    const link = document.createElement('a')
    link.href = url
    link.download = `${+new Date()}.png`
    link.click()
  }

  setGridBg (type) {
    const canvas = this.canvas.current
    console.log(canvas)
    if (type === 'transparent') {
      canvas.style.backgroundImage = ''
    } else if (type === 'grid') {
      canvas.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg%20width%3D%22100%25%22%20height%3D%22100%25%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22smallGrid%22%20width%3D%2210%22%20height%3D%2210%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M%2010%200%20L%200%200%200%2010%22%20fill%3D%22none%22%20stroke%3D%22gray%22%20stroke-width%3D%220.5%22%3E%3C%2Fpath%3E%3C%2Fpattern%3E%3Cpattern%20id%3D%22grid%22%20width%3D%22100%22%20height%3D%22100%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22url(%23smallGrid)%22%3E%3C%2Frect%3E%3Cpath%20d%3D%22M%20100%200%20L%200%200%200%20100%22%20fill%3D%22none%22%20stroke%3D%22gray%22%20stroke-width%3D%221%22%3E%3C%2Fpath%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23grid)%22%3E%3C%2Frect%3E%3C%2Fsvg%3E")'
    }
  }

  componentDidMount () {
    const canvas = this.canvas.current
    this.getContext()
    this.resize()
    this.resize = debounce(this.resize)
    window.addEventListener('resize', this.resize.bind(this))
    canvas.addEventListener('mousedown', this.handleDown.bind(this))
    canvas.addEventListener('mouseup', this.handleUp.bind(this))
    canvas.addEventListener('mousemove', this.handleMove.bind(this))
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize.bind(this))
  }

  render () {
    const { cursor, lastIndex, store, styles: { color, strokeWidth, lineCap, lineJoin }, svgElements: { rect, ellipse, path } } = this.state
    const { length } = store
    const { rgb: { r, g, b, a } } = color
    const colorStr = `rgba(${r},${g},${b},${a})`

    return (
      <div ref={this.boardContainer} className="board_container">
        <BoardTools cursor={cursor}
                    color={color}
                    disableUndo={lastIndex === length}
                    disableRedo={lastIndex === 0}
                    parent={this}
                    setColor={this.setColor.bind(this)}
                    setSize={this.setSize.bind(this)}
                    undo={this.undo.bind(this)}
                    redo={this.redo.bind(this)}
                    clearBoard={this.clearBoard.bind(this)}
                    setGridBg={this.setGridBg.bind(this)}
                    exportFile={this.exportFile.bind(this)}
        />
        <canvas className={`board_container--canvas cursor-${cursor}`} ref={this.canvas}/>
        <svg className="board_container--svg" ref={this.svg} xmlns="http://www.w3.org/2000/svg">
          <rect className={rect.hide ? 'hidden' : ''} x={rect.x} y={rect.y} width={rect.width}
                height={rect.height} fill="transparent" stroke={colorStr} strokeWidth={strokeWidth}
                strokeLinejoin={lineJoin} strokeLinecap={lineCap}/>
          <ellipse className={ellipse.hide ? 'hidden' : ''} cx={ellipse.x} cy={ellipse.y} rx={ellipse.rx}
                   ry={ellipse.ry} fill="transparent" stroke={colorStr} strokeWidth={strokeWidth}/>
          <path className={path.hide ? 'hidden' : ''} d={path.d} fill="transparent" stroke={colorStr}
                strokeWidth={strokeWidth} strokeLinejoin={lineJoin} strokeLinecap={lineCap}/>
        </svg>
      </div>
    )
  }
}

export default Board
