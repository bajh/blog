import React, { Component } from 'react'

export default class RecommendationButton extends Component {
    style = {
        backgroundColor: 'transparent',
        color: 'white',
        borderRadius: '6px',
        borderColor: 'white',
        borderStyle: 'solid',
        padding: '10px 8px',
    }

    render() {
        console.log(this.style)
        return (
            <button onClick={this.props.onClick} style={this.style}>
                Get Recommendation
            </button>
        )
    }
}