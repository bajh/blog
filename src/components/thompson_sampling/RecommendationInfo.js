import React, { Component } from 'react'

export default class RecommendationInfo extends Component {
    render() {
        return (
            <div style={{ marginBottom: '10px', color: '#ecf0f1' }}>
                <b style={{ display: 'block' }}>
                    {this.props.restaurant.name}
                </b>
                <i style={{ display: 'block', color: '#ecf0f1' }}>
                    {this.props.restaurant.vicinity}
                </i>
            </div>
        )
    }
}