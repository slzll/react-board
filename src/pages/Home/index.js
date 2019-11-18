import React, { Component } from 'react'
import Board from "components/Board"
import './index.scss'

class Home extends Component {
  render () {
    return (
      <main className="home_page">
        <div className="left_nav">
          <a href="/" target="_blank">
            首页
          </a>
        </div>
        <Board/>
      </main>
    )
  }
}

export default Home;
