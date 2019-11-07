import React, { PureComponent } from 'react'
import debounce from 'lodash/debounce'
import BoardTools from "./BoardTools"
import './index.scss'

class Board extends PureComponent {
  state = {
    coordinate: {
      originalX: 0,
      originalY: 0,
      upX: 0,
      upY: 0,
      x: 0,
      y: 0
    },
    canvas: {
      ctx: null,
      width: 0,
      height: 0
    },
    startDrawLine: false,
    store: [],
    lastIndex: 0,
    cursor: 'pen',
    styles: {
      color: { rgb: { r: 0, g: 0, b: 0, a: 1 } }
    },
    svgElements: {
      rect: [],
      circle: [],
      ellipse: []
    }
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
    const { canvas: { ctx }, cursor } = this.state
    const { offsetX, offsetY } = event
    let state = {
      coordinate: {
        ...this.state.coordinate,
        originalX: offsetX,
        originalY: offsetY
      },
      startDrawLine: true
    }
    switch (cursor) {
      case "square":
        state = {
          ...state,
          svgElements: {
            ...this.state.svgElements,
            rect: [
              ...this.state.svgElements.rect,
              { x: offsetX, y: offsetY, width: 0, height: 0, hide: true }
            ]
          }
        }
        break
      case 'circle':
        break
      default:
        break
    }

    this.setState(state)
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)
  }

  handleMove (e) {
    const { offsetX, offsetY, shiftKey } = e
    const { coordinate: { originalX, originalY }, canvas: { ctx }, startDrawLine, cursor } = this.state
    const svg = this.svg.current
    if (startDrawLine) {
      switch (cursor) {
        case 'pen':
          if (shiftKey) {
            let x = Math.abs(offsetX - originalX)
            let y = Math.abs(offsetY - originalY)
            ctx.lineTo(x >= y ? offsetX : originalX, x >= y ? originalY : offsetY)
            ctx.stroke()
          } else {
            ctx.lineTo(offsetX, offsetY)
            ctx.stroke()
          }
          break
        case 'eraser':
          ctx.clearRect(offsetX, offsetY, 10, 10)
          break
        case 'square':
          this.setState(prevState => {
            const { svgElements: { rect } } = prevState
            const width = offsetX - originalX
            const height = offsetY - originalY
            if (shiftKey) {
              rect[rect.length - 1] = {
                x: width >= 0 ? originalX : (originalX + width),
                y: height >= 0 ? originalY : (originalY + width),
                width: Math.abs(width),
                height: Math.abs(width),
                hide: false
              }
            } else {
              rect[rect.length - 1] = {
                x: width >= 0 ? originalX : (originalX + width),
                y: height >= 0 ? originalY : (originalY + height),
                width: Math.abs(width),
                height: Math.abs(height),
                hide: false
              }
            }
            return {
              svgElements: {
                ...prevState.svgElements,
                rect
              }
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
          const lastRect = rect[rect.length - 1]
          if (lastRect.width === 0 && lastRect.height === 0) {
            rect.pop()
          } else {
            lastRect.hide = true
          }
          return {
            svgElements: {
              ...prevState.svgElements,
              rect
            }
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
        ctx.stroke()
        break
      default:
        ctx.closePath()
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
        coordinate: {
          ...prevState.coordinate,
          upX: offsetX,
          upY: offsetY
        },
        store: [...store, img],
        lastIndex: 0,
        startDrawLine: false
      }
    })
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
      styles: {
        ...this.state.styles,
        color
      }
    })
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
    const { cursor, lastIndex, store, styles: { color }, svgElements: { rect } } = this.state
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
                    undo={this.undo.bind(this)}
                    redo={this.redo.bind(this)}
                    clearBoard={this.clearBoard.bind(this)}/>
        <canvas className={`board_container--canvas cursor-${cursor}`} ref={this.canvas}/>
        <svg className="board_container--svg" ref={this.svg} xmlns="http://www.w3.org/2000/svg">
          {
            rect.map((item, index) => (
                <rect className={item.hide ? 'hidden' : ''} key={index} x={item.x} y={item.y} width={item.width}
                      height={item.height}
                      fill="transparent" stroke={colorStr}/>
              )
            )
          }
        </svg>
      </div>
    )
  }
}

export default Board
