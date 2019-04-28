import React, { Component } from 'react'

export default class UpdateButtons extends Component {

  update = (val) => this.props.client.update(this.props.id, val)
    .then(this.props.onClick)

    buttonStyle = (color) => ({
        marginRight: '5px',
        borderColor: color,
        color,
        borderStyle: 'solid',
        backgroundColor: 'transparent',
        borderRadius: '8px',
        padding: '6px 8px',
    })

    render() {
        const { color } = this.props
        return (
            <div>
                <button
                    onClick={() => this.update(1)}
                    style={this.buttonStyle(color)}
                >
                    👍
                </button>
                <button
                    onClick={() => this.update(0)}
                    style={this.buttonStyle(color)}
                >
                    👎
                </button>
            </div>
        )
    }
}