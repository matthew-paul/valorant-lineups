## Valorant Lineups

### Website

[valorant-lineups.com](https://valorant-lineups.com)
 

valorant-lineups is a website to display lineup tutorials for agents in VALORANT using react, aws dynamodb, lambda, and api gateway. 

## Project Status

This project is currently in development. Users can still view lineups from [the abilities tab](https://valorant-lineups.com/abilities), but I am working on adding more.

## Project Screen Shot(s)

[ PRETEND SCREEN SHOT IS HERE ]

[ PRETEND OTHER SCREEN SHOT IS HERE ]

## Installation and Setup Instructions

Clone down this repository. You will need [node](https://nodejs.org/en/), [npm](https://nodejs.org/en/), and [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable) installed globally on your machine.  

Installation:

`yarn`

To Start Server:

`yarn start`  

To Visit App:

`localhost:3000/`  

## Reflection

This was a side project I created in about 4 weeks based off [this google slides](https://docs.google.com/presentation/d/1lC66dZQBioIc2E_sOvXS3ZoNykfSPl0Xj5qaDqknwwA/present?slide=id.g8d7eda0435_9_159), which had the same idea, but was not as interactive or manageable.

I wanted to build a website that could provide an easy way to access lineups during a game using an interactive map with filters to quickly choose which lineup would be best for the current situation.

This project was a great way to gain experience using react and AWS.

Some obstacles I encountered included storing the lineups in an efficient way using dynamoDB so the user could retrieve them quickly, creating an AWS lambda program to process API requests and minimize unnecessary calls, and making the map scale and rotate in relation to the marker overlays 

At the end of the day, the technologies implemented in this project are React, React-Router, DynamoDB, AWS lambda, AWS Api Gateway, Vercel, and a signficant amount of JSX and CSS/SASS.