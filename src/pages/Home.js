import React, { useEffect } from 'react'

const Home = () => {

    useEffect(() => {
        document.title = "Home"
    }, [])

    return (
        <div className='home'>
            <h1>Home</h1>
            <div className='home-content'>
                <text>'Valorant Lineups' was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. &nbsp;
                    <text style={{ textDecoration: 'underline' }}>Riot Games does not endorse or sponsor this project.</text>
                </text>

            </div>
        </div>
    )
}

export default Home
