import React, { Component } from 'react'
import { AGENT_LIST, ABILITY_LIST, TAG_LIST } from '../component-utils/constants';
import MultiSelect from 'react-multi-select-component';

import { WithContext as ReactTags } from 'react-tag-input'

export class Form extends Component {

    state = {
        name: '',
        description: '',
        agent: 0,   // actual agent list starts at 1
        ability: 0, // actual ability list starts at 1
        tags: [],
        images: [],
        video: [],
        agentList: [],
        abilityList: [],
        x: -1,
        y: -1,
        startX: -1,
        startY: -1,
    }

    constructor(props) {
        super(props);

        // add agents from file
        this.state.agentList = this.dictToArray(AGENT_LIST)
        this.handleImageDelete = this.handleImageDelete.bind(this);
        this.handleImageAdd = this.handleImageAdd.bind(this);

    }

    onTagChange = (tagList) => {
        this.setState({
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


    change = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    changedAgent = (e) => {
        console.log('agent selected:', e.target.value)

        // update agent, then get and update abilities for that agent
        this.setState({
            agent: e.target.value,
            abilityList: this.dictToArray(ABILITY_LIST[e.target.value])
        })
    }

    onSubmit = e => {
        // TODO: validate input


        // prevent page auto refresh
        e.preventDefault()
        console.log(this.state)
    }

    handleImageDelete(i) {
        const { images } = this.state;
        this.setState({
            images: images.filter((tag, index) => index !== i)
        });
    }

    handleImageAdd(tag) {
        this.setState(state => ({ images: [...state.images, tag] }));
    }

    render() {
        return (
            <form className='lineup-form'>
                {/* Lineup Name */}
                <label className='lineup-form-label'>TEST</label>
                <input
                    name='name'
                    placeholder='lineup name'
                    value={this.state.name}
                    onChange={e => this.change(e)}
                />
                {/* Agent */}
                <select className='first-opt-hidden' name='agent' onChange={e => this.changedAgent(e)}>
                    <option value={0}> -- Agent -- </option>
                    {this.state.agentList.map((agent) =>
                        <option key={agent[0]} value={agent[0]}>
                            {agent[1]}
                        </option>
                    )}
                </select>
                {/* Ability */}
                <select className='first-opt-hidden' name='ability' onChange={e => this.change(e)}>
                    <option value={0}> -- Ability -- </option>
                    {this.state.abilityList.map((ability) =>
                        <option key={ability[0]} value={ability[0]}>
                            {ability[1]}
                        </option>
                    )}
                </select>
                {/* Tags */}
                <MultiSelect
                    className='multi-select'
                    options={TAG_LIST}
                    value={this.state.tags}
                    onChange={this.onTagChange}
                    labelledBy="Select"
                    hasSelectAll={false}
                    disableSearch={true}
                />
                {/* Images */}
                <ReactTags
                    placeholder="Add image link"
                    tags={this.state.images}
                    handleDelete={this.handleImageDelete}
                    handleAddition={this.handleImageAdd}
                    allowDragDrop={false}
                    inputFieldPosition="top"
                />

                {/* X */}

                {/* Y */}

                {/* Start X */}

                {/* Start Y */}

                <button onClick={(e) => this.onSubmit(e)}>Enter</button>

            </form>
        )
    }
}

export default Form

