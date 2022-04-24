## Valorant Lineups

### Website

[valorant-lineups.com](https://valorant-lineups.com)

valorant-lineups is a website to display lineup tutorials for agents in VALORANT using react.

## Project Status

The project is mostly complete, I am now mostly working on UI changes and adding more lineups.

## Project Screen Shots

![website screenshot](https://i.imgur.com/Rb4uGld.png)

## Installation and Setup Instructions

Clone down this repository. You will need [node](https://nodejs.org/en/), [npm](https://nodejs.org/en/), and [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable) installed globally on your machine.

Installation:

`yarn install`

To Start Server:

`yarn start`

To Visit App:

`localhost:3000/`

## Reflection

This was a side project I created in about 4 weeks based off [this google slides](https://docs.google.com/presentation/d/1lC66dZQBioIc2E_sOvXS3ZoNykfSPl0Xj5qaDqknwwA/present?slide=id.g8d7eda0435_9_159), which had the same idea, but was not as interactive or manageable.

I wanted to build a website that could provide an easy way to access lineups during a game using an interactive map with filters to quickly choose which lineup would be best for the current situation.

This project was a great way to gain experience using react and AWS.

Some obstacles I encountered included storing the lineups in an efficient way using dynamoDB so the user could retrieve them quickly, creating an AWS lambda program to process API requests and minimize unnecessary calls, and making the map scale and rotate in relation to the marker overlays. A large challenge was developing a clustering algorithm for the markers, so multiple lineups in the same spot would not overlap each other.

At the end of the day, the technologies implemented in this project are React, React-Router, AWS (DynamoDB, Lambda, API Gateway, Cloudfront, S3), Vercel, and a signficant amount of JSX and CSS/SASS.
