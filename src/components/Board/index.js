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
    cursor: 'pen'
  }

  constructor (props) {
    super(props)
    this.canvas = React.createRef()
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

  clearBoard () {
    console.log('清空board')
    const { ctx, width, height } = this.state.canvas
    console.log(ctx, width, height)
    ctx.clearRect(0, 0, width, height)
  }

  componentDidMount () {
    const { current } = this.canvas
    const ctx = current.getContext('2d')
    this.setState((prevState) => {
      const { width, height } = prevState.canvas
      return { canvas: { ctx, width, height } }
    })
    this.resize()
    this.resize = debounce(this.resize)
    window.addEventListener('resize', this.resize.bind(this), false)
    this.canvas.current.addEventListener('mousedown', (event) => {
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
    })
    this.canvas.current.addEventListener('mouseup', (event) => {
      const { ctx } = this.state.canvas
      this.setState({
        coordinate: {
          ...this.state.coordinate,
          upX: event.clientX,
          upY: event.clientY
        },
        startDrawLine: false
      })
      ctx.closePath()
    })
    this.canvas.current.addEventListener('mousemove', (e) => {
      this.handleMove(e)
    })
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize.bind(this))
  }

  render () {
    const { cursor } = this.state
    return (
      <div className="board_container">
        <BoardEraser clearBoard={this.clearBoard.bind(this)} cursor={cursor} parent={this}/>
        <canvas className={`board_container--canvas cursor-${cursor}`} ref={this.canvas}/>
      </div>
    )
  }
}

export default Board
