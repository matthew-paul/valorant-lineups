import React, { Component } from 'react'
import { AGENT_LIST, ABILITY_LIST, TAG_LIST } from './constants';
import MultiSelect from 'react-multi-select-component';
import PropTypes from 'prop-types'

import { WithContext as ReactTags } from 'react-tag-input'

export class Form extends Component {

    state = {
        name: '',
        description: '',
        agent: 0,   // agent list starts at 1
        ability: 0, // ability list starts at 1
        tags: [],
        images: [],
        video: '',
        credits: '',
        agentList: [],
        abilityList: [],
    }

    constructor(props) {
        super(props);

        // add agents from file
        this.state.agentList = this.dictToArray(AGENT_LIST)
        this.handleImageDelete = this.handleImageDelete.bind(this);
        this.handleImageAdd = this.handleImageAdd.bind(this);

    }

    updateChildAndParent = (values) => {
        this.setState(values)
        this.props.updateParent(values)
    }

    onTagChange = (tagList) => {
        this.updateChildAndParent({
            tags: tagList
        })
    }

    dictToArray = (dictionary) => {
        var arr = [];

        for (var key in dictionary) {
            arr.push([key, dictionary[key]]);
        }

        return arr;
    }

    updateState = (e) => {
        this.updateChildAndParent({
            [e.target.name]: e.target.value
        });
    }

    changedAgent = (e) => {
        // update agent, then get and update abilities for that agent
        this.setState({
            agent: e.target.value,
            ability: 0,
            abilityList: this.dictToArray(ABILITY_LIST[e.target.value])
        })
        this.props.updateParent({
            agent: e.target.value,
            ability: 0
        })
    }

    handleImageDelete = (i) => {
        const { images } = this.state;
        this.updateChildAndParent({
            images: images.filter((tag, index) => index !== i)
        });
    }

    handleImageAdd = (image) => {
        this.updateChildAndParent({
            images: [...this.state.images, image]
        });
    }

    onKeyPress = (event) => {
        // problem with react tag when pressing enter in video input
        if (event.key === "Enter") {
            event.preventDefault();
            // allow submit from last input
            if (event.target.name === 'credits') {
                this.props.onSubmit(event);
            }
        }
    }

    render() {
        return (
            <form className='lineup-form'>
                {/* Info Message */}
                {
                    this.props.infoMessage.value !== '' ?
                        <div className='row'>
                            <h2 className={'info-box ' + this.props.infoMessage.type}>{this.props.infoMessage.value}</h2>
                        </div>
                        :
                        ''
                }
                {/* Lineup Title */}
                <div className='row'>
                    <input
                        className='design-label'
                        name='name'
                        placeholder='Lineup Title'
                        value={this.state.name}
                        onChange={e => this.updateState(e)}
                        autoComplete='off'
                        onKeyDown={this.onKeyPress}
                    />
                </div>
                {/* Description */}
                <div className='row'>
                    <input
                        className='description'
                        name='description'
                        placeholder='Lineup Description'
                        value={this.state.description}
                        onChange={e => this.updateState(e)}
                        autoComplete='off'
                        onKeyDown={this.onKeyPress}
                    />
                </div>
                {/* Agent */}
                <div className='row'>
                    <select className='first-opt-hidden design-label' name='agent' onChange={e => this.changedAgent(e)}>
                        <option value={0}> -- Agent -- </option>
                        {this.state.agentList.map((agent) =>
                            <option key={agent[0]} value={agent[0]}>
                                {agent[1]}
                            </option>
                        )}
                    </select>
                </div>
                {/* Ability */}
                <div className='row'>
                    <select className='first-opt-hidden design-label' name='ability' onChange={e => this.updateState(e)}>
                        <option value={0}> -- Ability -- </option>
                        {this.state.abilityList.map((ability) =>
                            <option key={ability[0]} value={ability[0]}>
                                {ability[1]}
                            </option>
                        )}
                    </select>
                </div>
                {/* Tags */}
                <div className='row'>
                    <MultiSelect
                        className='multi-select'
                        options={TAG_LIST}
                        value={this.state.tags}
                        onChange={this.onTagChange}
                        labelledBy="Select"
                        hasSelectAll={false}
                        disableSearch={true}
                        overrideStrings={{ 'selectSomeItems': 'Select Tags...' }}
                    />
                </div>
                {/* Images */}
                <div className='row'>
                    <ReactTags
                        placeholder="Add image link(s) and press enter"
                        tags={this.state.images}
                        handleDelete={this.handleImageDelete}
                        handleAddition={this.handleImageAdd}
                        allowDragDrop={false}
                        inputFieldPosition="top"
                        allowDeleteFromEmptyInput={true}
                    />
                </div>
                {/* Video */}
                <div className='row'>
                    <input
                        className='design-label'
                        name='video'
                        placeholder='Youtube embed ID'
                        value={this.state.video}
                        onChange={e => this.updateState(e)}
                        autoComplete='off'
                        onKeyDown={this.onKeyPress}
                    />
                </div>
                {/* Credits */}
                <div className='row'>
                    <input
                        className='design-label'
                        name='credits'
                        placeholder='Credits'
                        value={this.state.credits}
                        onChange={e => this.updateState(e)}
                        autoComplete='off'
                        onKeyDown={this.onKeyPress}
                    />
                </div>
                {/* Submit Button */}
                <div className='row'>
                    <button className='submit-button' onClick={(e) => this.props.onSubmit(e)}>Enter</button>
                </div>

            </form>
        )
    }
}


Form.propTypes = {
    updateParent: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    infoMessage: PropTypes.object
}

export default Form

