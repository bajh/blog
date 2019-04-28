import React, { Component } from 'react'
import UpdateButtons from './UpdateButtons'

export default class Restaurant extends Component {
    render() {
        const { restaurant } = this.props
        return (
            <div style={{ paddingBottom: '6px', marginBottom: '6px', border: '2px solid ' + restaurant.color }}>
                <div style={{ backgroundColor: restaurant.color, color: '#ecf0f1', padding: '8px 6px', marginBottom: '6px' }}>
                    {restaurant.name}
                </div>
                <UpdateButtons
                    client={this.props.client}
                    id={restaurant.id}
                    color={restaurant.color}
                    onClick={this.props.onUpdate}
                />
            </div>
        )
    }
}