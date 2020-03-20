import React, {Component} from 'react';
import {render} from 'react-dom';
import MapGL, {Source, Layer} from 'react-map-gl';
import {json as requestJson} from 'd3-request';

import {dataLayer} from './components/atoms/map-style.js';
import {updatePercentiles} from './utils/utils';
import ControlPanel from './components/molecules/control-panel';

import './App.css';


const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN; // Set your mapbox token here

export default class App extends Component {
  state = {
    year: 2015,
    data: null,
    hoveredFeature: null,
    viewport: {
      latitude: 40,
      longitude: -100,
      zoom: 3.5,
      bearing: 0,
      pitch: 0
    }
  };

  componentDidMount() {
    requestJson(
      'https://raw.githubusercontent.com/uber/react-map-gl/master/examples/.data/us-income.geojson',
      (error, response) => {
        if (!error) {
          console.log('requestJSON()', response);
          this._loadData(response);
        }
      }
    );
  }

  _loadData = data => {
    this.setState({
      data: updatePercentiles(data, f => f.properties.income[this.state.year])
    });
  };

  _updateSettings = (name, value) => {
    if (name === 'year') {
      this.setState({year: value});

      const {data} = this.state;
      if (data) {
        // trigger update
        this.setState({
          data: updatePercentiles(data, f => f.properties.income[value])
        });
      }
    }
  };

  _onViewportChange = viewport => this.setState({viewport});

  _onHover = event => {
    const {
      features,
      srcEvent: {offsetX, offsetY}
    } = event;
    const hoveredFeature = features && features.find(f => f.layer.id === 'data');

    this.setState({hoveredFeature, x: offsetX, y: offsetY});
  };

  _renderTooltip() {
    const {hoveredFeature, x, y} = this.state;

    return (
      hoveredFeature && (
        <div className="tooltip" style={{left: x, top: y}}>
          <div>State: {hoveredFeature.properties.name}</div>
          <div>Median Household Income: {hoveredFeature.properties.value}</div>
          <div>Percentile: {(hoveredFeature.properties.percentile / 8) * 100}</div>
        </div>
      )
    );
  }

  render() {
    const {viewport, data} = this.state;
    console.log('render()', data);

    return (
      <div style={{height: '100%', position: 'relative'}}>
        <MapGL
          {...viewport}
          width="100%"
          height="100%"
          mapStyle="mapbox://styles/mapbox/light-v9"
          onViewportChange={this._onViewportChange}
          mapboxApiAccessToken={MAPBOX_TOKEN}
          onHover={this._onHover}
        >
          <Source type="geojson" data={data}>
            <Layer {...dataLayer} />
          </Source>
          {this._renderTooltip()}
        </MapGL>

        <ControlPanel
          containerComponent={this.props.containerComponent}
          settings={this.state}
          onChange={this._updateSettings}
        />
      </div>
    );
  }
}

export function renderToDom(container) {
  render(<App />, container);
}
