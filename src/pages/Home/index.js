import React, { Component } from 'react'
import Board from "components/Board"
import './index.scss'

class Home extends Component {
  render () {
    return (
      <main className="home_page">
        <div className="left_nav">
          首页
        </div>
        <Board/>
      </main>
    )
  }
}

export default Home;
