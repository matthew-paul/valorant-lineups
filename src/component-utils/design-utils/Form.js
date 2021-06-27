import React, { Component } from 'react'
import * as CONSTANTS from '../constants';
import MultiSelect from 'react-multi-select-component';
import PropTypes from 'prop-types'

import { WithContext as ReactTags } from 'react-tag-input'
import Select from 'react-select';

export class Form extends Component {

    customStyles = {
        container: (styles) => ({
            ...styles,
            width: '100%',
            height: '45px',
            padding: '0px 10px',
            marginBottom: '10px',
        }),
        control: (styles) => ({
            ...styles,
            height: '100%',
        })
    }

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
        apiKey: '',
        selectedAbility: null,
    }

    constructor(props) {
        super(props);

        // add agents from file
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

    updateState = (e) => {
        this.updateChildAndParent({
            [e.target.name]: e.target.value
        });
    }

    onAgentChange = (agent) => {
        // update agent, then get and update abilities for that agent
        this.setState({
            agent: agent.value,
            ability: 0,
            abilityList: CONSTANTS.ABILITY_LIST[agent.value],
            selectedAbility: null,
        })
        this.props.updateParent({
            agent: agent.value,
            ability: 0
        })
    }

    onAbilityChange = (ability) => {
        // update agent, then get and update abilities for that agent
        this.setState({
            selectedAbility: ability
        })
        this.updateChildAndParent({
            ability: ability.value,
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
            if (event.target.name === 'apiKey') {
                this.props.onSubmit(event);
            }
        }
    }

    render() {
        return (
            <form className='lineup-form'>
                {/* Info Message */}
                {this.props.infoMessage.value !== '' ?
                    <div className='row'>
                        <h2 className={'info-box ' + this.props.infoMessage.type}>{this.props.infoMessage.value}</h2>
                    </div>
                    :
                    ''}
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
                    <textarea
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
                <Select label="Agent select" placeholder='Agent...' options={CONSTANTS.AGENT_LIST} styles={this.customStyles} onChange={this.onAgentChange} />
                {/* Ability */}
                <Select label="Ability select" value={this.state.selectedAbility} placeholder='Ability...' options={this.state.abilityList} styles={this.customStyles} onChange={this.onAbilityChange} />
                {/* Tags */}
                <div className='row'>
                    <MultiSelect
                        className='multi-select'
                        options={CONSTANTS.TAG_LIST}
                        value={this.state.tags}
                        onChange={this.onTagChange}
                        labelledBy="Select"
                        hasSelectAll={false}
                        disableSearch={false}
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
                {/* Api Key */}
                <div className='row'>
                    <input
                        className='design-label'
                        name='apiKey'
                        placeholder='Api Key'
                        value={this.state.apiKey}
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

