import React, { PureComponent } from 'react'
import { ChromePicker } from 'react-color'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faAngleDown, faAngleUp, faRedo, faTrash, faUndo, faEraser, faPen } from "@fortawesome/free-solid-svg-icons"
import { faSquare, faCircle } from '@fortawesome/free-regular-svg-icons'


class BoardTools extends PureComponent {
  state = {
    isShowTools: true,
    displayColorPicker: false
  }

  constructor (props) {
    super(props)
    this.colorBtn = React.createRef()
  }

  toggleTools () {
    const { isShowTools } = this.state
    this.setState({
      isShowTools: !isShowTools
    })
  }

  clearBoard () {
    this.props.clearBoard()
  }

  changeTool (cursor) {
    const { parent } = this.props
    parent.setState({
      cursor
    })
  }

  undo () {
    this.props.undo()
  }

  redo () {
    this.props.redo()
  }

  toggleColorPicker (e) {
    e.stopPropagation()
    this.setState({
      displayColorPicker: !this.state.displayColorPicker
    })
  }

  handleColorChange (color) {
    this.props.setColor(color)
  }

  handleDocumentClick (e) {
    if (this.colorBtn && !this.colorBtn.current.contains(e.target)) {
      if (this.state.displayColorPicker) {
        this.toggleColorPicker(e)
      }
    }
  }

  componentDidMount () {
    document.addEventListener('click', this.handleDocumentClick.bind(this))
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleDocumentClick.bind(this))
  }

  render () {
    const { isShowTools, displayColorPicker } = this.state
    const { cursor, color, disableRedo, disableUndo } = this.props
    const { rgb: { r, g, b, a } } = color
    const colorStyle = {
      width: '28px',
      height: '14px',
      borderRadius: '2px',
      background: `rgba(${r}, ${g}, ${b}, ${a})`
    }

    return (
      <div className={`board_container--tools ${isShowTools ? '' : 'hidden-tools'}`}>
        <button className={`button is-small ${cursor === 'pen' ? 'is-success' : ''}`}
                onClick={() => this.changeTool('pen')}>
          <span className="icon"> <FontAwesomeIcon icon={faPen}/> </span>
          <span>铅笔</span>
        </button>
        <button className={`button is-small ${cursor === 'square' ? 'is-success' : ''}`}
                onClick={() => this.changeTool('square')}>
          <span className="icon"> <FontAwesomeIcon icon={faSquare}/> </span>
          <span>矩形</span>
        </button>
        <button className={`button is-small ${cursor === 'circle' ? 'is-success' : ''}`}
                onClick={() => this.changeTool('circle')}>
          <span className="icon"> <FontAwesomeIcon icon={faCircle}/> </span>
          <span>圆形</span>
        </button>
        <button ref={this.colorBtn} className={`button is-small ${displayColorPicker ? 'show-color-picker' : ''}`}
                onClick={this.toggleColorPicker.bind(this)}>
          <span className="icon" style={colorStyle}/>
          <span>颜色</span>
          <div className="color_picker--container" onClick={e => e.stopPropagation()}>
            <ChromePicker color={color.rgb} onChange={this.handleColorChange.bind(this)}/>
          </div>
        </button>
        <button className={`button is-small ${cursor === 'eraser' ? 'is-success' : ''}`}
                onClick={() => this.changeTool('eraser')}>
          <span className="icon"><FontAwesomeIcon icon={faEraser}/></span>
          <span>擦除</span>
        </button>
        <button className="button is-small" onClick={() => this.undo()} disabled={disableUndo}>
          <span className="icon"><FontAwesomeIcon icon={faUndo}/></span>
          <span>撤销</span>
        </button>
        <button className="button is-small" onClick={() => this.redo()} disabled={disableRedo}>
          <span className="icon"><FontAwesomeIcon icon={faRedo}/></span>
          <span>取消撤销</span>
        </button>
        <button className="button is-small" onClick={() => this.clearBoard()}>
          <span className="icon"><FontAwesomeIcon icon={faTrash}/></span>
          <span>清空</span>
        </button>
        <button className="button is-small tools-control-btn" onClick={() => this.toggleTools()}>
          <span className="icon"><FontAwesomeIcon icon={isShowTools ? faAngleUp : faAngleDown}/></span>
        </button>
      </div>
    )
  }
}

export default BoardTools