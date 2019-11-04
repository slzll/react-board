import React, { PureComponent } from 'react'
import debounce from 'lodash/debounce'
import BoardEraser from "./BoardEraser"
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
    cursor: 'pen'
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
    const { clientX, clientY } = e
    const { canvas: { ctx }, startDrawLine, cursor } = this.state
    switch (cursor) {
      case 'pen':
        if (startDrawLine) {
          ctx.lineTo(clientX, clientY)
          ctx.stroke()
        }
        break
      case 'eraser':
        if (startDrawLine) {
          ctx.clearRect(clientX, clientY, 10, 10)
        }
        break
      default:
        break
    }
  }

  handleUp (event) {
    const { canvas: { ctx } } = this.state
    ctx.closePath()
    const imgData = this.canvas.current.toDataURL()
    this.setState({
      coordinate: {
        ...this.state.coordinate,
        upX: event.clientX,
        upY: event.clientY
      },
      store: [...this.state.store, imgData],
      startDrawLine: false
    })


  }

  clearBoard () {
    console.log('清空board')
    const { ctx, width, height } = this.state.canvas
    console.log(ctx, width, height)
    ctx.clearRect(0, 0, width, height)
  }

  undo () {
    const { canvas: { ctx }, lastIndex, store } = this.state
    const { length } = store
    console.log(store)
    if (length > 0 && lastIndex < length) {
      console.log("撤销")
      const imgData = store[length - lastIndex - 1]
      this.clearBoard()
      ctx.drawImage(imgData, 0, 0)
    }
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
    const { cursor } = this.state
    return (
      <div className="board_container">
        <BoardEraser cursor={cursor}
                     parent={this}
                     undo={this.undo.bind(this)}
                     clearBoard={this.clearBoard.bind(this)}/>
        <canvas className={`board_container--canvas cursor-${cursor}`} ref={this.canvas}/>
      </div>
    )
  }
}

export default Board
