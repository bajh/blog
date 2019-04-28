import React, { Component } from 'react';
import DistChart from './DistChart'
import Restaurant from './Restaurant'
import RecommendationButton from './RecommendationButton'
import RecommendationInfo from './RecommendationInfo'
import { BlogPostClient as Client } from './Client'
import './App.css';

class App extends Component {
  constructor(props) {
      super(props)
      this.state = {
          distributions: [],
          recommendation: null,
      }
  }

  componentDidMount = () => this.getDistributions()

  getDistributions = () => Client.getDistributions()
    .then((distributions) => {
        this.setState({
            distributions,
        })
    })

  getRecommendation = () => Client.getRecommendation()
    .then((recommendation) =>
        this.setState({ recommendation }))

  style = {
    fontFamily: 'sans-serif',
    display: 'flex',
    flex: '1 1 auto',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    margin: '0px',
    textAlign: 'center',
    backgroundColor: '#2c3e50',
    padding: '8px 10px',
    fontSize: '14px',
  }

  render() {
    const { distributions, recommendation } = this.state

    return (
      <div className="App" style={this.style}>
          <div >
              <DistChart
                  distributions={this.state.distributions}
                  sampledProbabilities={recommendation && recommendation.probabilities}
                  height="400px"
                  width="600px"
              />
          </div>
          <div style={{ marginLeft: '20px' }}>
              <div style={{ marginBottom: '40px' }}>
                  {recommendation && <RecommendationInfo
                      restaurant={recommendation.restaurant}
                  />}
                  <RecommendationButton onClick={this.getRecommendation} />
              </div>
              <div>
                  {distributions.map((d) =>
                      <Restaurant
                        client={Client}
                        key={d.restaurant.id}
                        restaurant={d.restaurant}
                        onUpdate={this.getDistributions}
                      />
                  )}
              </div>
          </div>
      </div>
    );
  }
}

export default App;
