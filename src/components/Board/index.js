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
    }
  }

  constructor (props) {
    super(props)
    this.canvas = React.createRef()
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
    const { clientWidth, clientHeight } = document.documentElement
    const { current } = this.canvas
    current.width = clientWidth
    current.height = clientHeight
    current.style.width = `${clientWidth}px`
    current.style.height = `${clientHeight}px`
    this.setState(prevState => {
      const { ctx } = prevState.canvas
      return { canvas: { ctx, width: clientWidth, height: clientHeight } }
    })
  }

  handleDown (event) {
    const { ctx } = this.state.canvas
    const { clientX, clientY } = event
    this.setState({
      coordinate: {
        ...this.state.coordinate,
        originalX: clientX,
        originalY: clientY
      },
      startDrawLine: true
    })
    ctx.beginPath()
    ctx.moveTo(clientX, clientY)
  }

  handleMove (e) {
    const { clientX, clientY, shiftKey } = e
    const { coordinate: { originalX, originalY }, canvas: { ctx }, startDrawLine, cursor } = this.state
    if (startDrawLine) {
      switch (cursor) {
        case 'pen':
          if (shiftKey) {
            let x = Math.abs(clientX - originalX)
            let y = Math.abs(clientY - originalY)
            ctx.lineTo(x >= y ? clientX : originalX, x >= y ? originalY : clientY)
            ctx.stroke()
          } else {
            ctx.lineTo(clientX, clientY)
            ctx.stroke()
          }
          break
        case 'eraser':
          ctx.clearRect(clientX, clientY, 10, 10)
          break
        default:
          break
      }
    }
  }

  handleUp (event) {
    const { clientX, clientY, shiftKey } = event
    const { coordinate: { originalX, originalY }, canvas: { ctx }, lastIndex, store, cursor } = this.state
    const { length } = store
    let w = 0, h = 0
    switch (cursor) {
      case 'square':
        w = clientX - originalX
        h = clientY - originalY
        ctx.beginPath()
        if (shiftKey) {
          ctx.strokeRect(originalX, originalY, w, w)
        } else {
          ctx.strokeRect(originalX, originalY, w, h)
        }
        ctx.stroke()
        break
      case 'circle':
        w = clientX - originalX
        h = clientY - originalY
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
    this.setState({
      coordinate: {
        ...this.state.coordinate,
        upX: clientX,
        upY: clientY
      },
      store: [...store, img],
      lastIndex: 0,
      startDrawLine: false
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
    this.getContext()
    this.resize()
    this.resize = debounce(this.resize)
    window.addEventListener('resize', this.resize.bind(this))
    this.canvas.current.addEventListener('mousedown', this.handleDown.bind(this))
    this.canvas.current.addEventListener('mouseup', this.handleUp.bind(this))
    this.canvas.current.addEventListener('mousemove', this.handleMove.bind(this))
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize.bind(this))
  }

  render () {
    const { cursor, lastIndex, store, styles: { color } } = this.state
    const { length } = store
    return (
      <div className="board_container">
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
      </div>
    )
  }
}

export default Board
