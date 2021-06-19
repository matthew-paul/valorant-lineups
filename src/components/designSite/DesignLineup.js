import React, { Component } from 'react'
//import { AGENT_LIST, ABILITY_LIST, MAP_LIST, TAG_LIST } from './constants'

import Form from './Form.js'
import MapInteractionCSS from '../component-utils/MapInteractionCSS.js'
import Map from '../component-utils/Map.js'
import Marker from '../lineupSite/Marker.js'
import startIcon from '../../resources/start-icon.png'

export class DesignLineup extends Component {

    constructor(props) {
        super(props);

        this.settingLineupPosition = false;
        this.settingStartPosition = false;
        this.defaultState = {
            name: '',
            description: '',
            agent: 0,   // actual agent list starts at 1
            ability: 0, // actual ability list starts at 1
            mapId: 1,
            tags: [],
            images: [],
            video: '',
            credits: '',
            x: -1,
            y: -1,
            startX: -1,
            startY: -1,
            infoMessage: { type: 'info', value: '' },
        }
        this.state = this.defaultState

    }


    updateState = (values) => {
        this.setState(values)
    }

    onMapClick = (e) => {
        let x = (e.nativeEvent.offsetX - 12.5) / 10.0
        let y = (e.nativeEvent.offsetY - 12.5) / 10.0

        if (0 > x || x > 100 || 0 > y || y > 100) {
            return;
        }

        if (this.settingLineupPosition) {
            this.setState({
                x: x,
                y: y
            })
        }

        if (this.settingStartPosition) {
            this.setState({
                startX: x,
                startY: y
            })
        }

        this.settingLineupPosition = false
        this.settingStartPosition = false
    }

    onSubmit = e => {
        // prevent page auto refresh
        e.preventDefault()

        // validate input

        // Get tag list
        if (this.state.name === '') {
            this.setState({
                infoMessage: { type: 'error', value: 'Enter a lineup title' }
            })
            return;
        }

        if (this.state.agent === 0) {
            this.setState({
                infoMessage: { type: 'error', value: 'Select an agent' }
            })
            return;
        }

        if (this.state.ability === 0) {
            this.setState({
                infoMessage: { type: 'error', value: 'Select an ability' }
            })
            return;
        }

        if (this.state.images.length === 0) {
            this.setState({
                infoMessage: { type: 'error', value: 'Enter an image link' }
            })
            return;
        }

        if (this.state.video === '') {
            this.setState({
                infoMessage: { type: 'error', value: 'Enter a youtube video id' }
            })
            return;
        }

        console.log('state VALIDDDD')

        // send state to dynamodb


        this.setState({
            infoMessage: { type: 'info', value: '' }
        })

        setTimeout(() => {
            this.setState({
                infoMessage: { type: 'success', value: 'Sent lineup to database' }
            })
        }, 100)


    }

    onContextMenu = (event) => {
        event.preventDefault();
    }

    setLineupPositionClicked = () => {
        if (this.settingStartPosition) {
            this.settingStartPosition = false;
        }
        this.settingLineupPosition = true;

    }

    setStartPositionClicked = () => {
        if (this.settingLineupPosition) {
            this.settingLineupPosition = false;
        }
        this.settingStartPosition = true;

    }

    render() {
        return (
            <div className='design-outer-frame'>
                <h1 className='design-site-header' >LINEUP CREATION</h1>
                <div className='design-form-frame'>
                    <div className='map-and-buttons'>
                        <div className='map-select-point'>
                            <button className='map-button' onClick={this.setLineupPositionClicked}>Set Lineup Position</button>
                            <button className='map-button' onClick={this.setStartPositionClicked}>Set Start Position</button>
                        </div>
                        <div className='design-map-frame' onContextMenu={this.onContextMenu} >
                            <MapInteractionCSS>
                                <Map mapId={this.state.mapId} onMapClick={this.onMapClick} />

                                <div className='marker-frame'>
                                    {this.state.x !== -1 ?
                                        <Marker key={1} lineup={this.state} onClick={() => { this.setState({ x: -1, y: -1 }) }} /> : ''
                                    }
                                    {this.state.startX !== -1 ?
                                        <img
                                            className='marker-icon'
                                            src={startIcon}
                                            alt='recon bolt'
                                            style={{ left: `${this.state.startX}%`, top: `${this.state.startY}%` }}
                                            onClick={() => { this.setState({ startX: -1, startY: -1 }) }}
                                        /> : ''
                                    }
                                </div>

                            </MapInteractionCSS>
                        </div>
                    </div>
                    <Form updateParent={this.updateState} onSubmit={this.onSubmit} infoMessage={this.state.infoMessage} />
                </div>
            </div>
        )
    }
}

export default DesignLineup
