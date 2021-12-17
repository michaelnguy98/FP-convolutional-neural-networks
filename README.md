# Website link

[Final Project](https://uw-cse442-wi20.github.io/FP-convolutional-neural-networks/)

Post-mortem version here: [convolutionalneuralnetworks.tk](https://convolutionalneuralnetworks.tk)

## Getting Started

This repo is set up to use the [Parcel](https://parceljs.org/) bundler. If you don't
like the way we've set things up, feel free to change it however you like!

### Install

#### Required software

You must have Node.js installed. I prefer to install it using [nvm](https://github.com/nvm-sh/nvm)
because it doesn't require sudo and makes upgrades easier, but you can also just get it directly from
https://nodejs.org/en/.

#### Install dependecies

Once you've got `node`, run the command `npm install` in this project folder
and it will install all of the project-specific dependencies (if you're curious open up `package.json` to see where these are listed).

npm is the _node package manager_.

### Running the local dev server

To run the project locally, run `npm start` and it will be available at http://localhost:1234/.

### Building the final output

Run `npm run build` and all of your assets will be compiled and placed into the `dist/` folder. Note
that this command will overwrite the existing docs folder.