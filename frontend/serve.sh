#!/bin/bash

# Production server for Render Frontend
# Serves the built React app on port 3000

cd frontend
npm install -g serve
serve -s dist -l 3000
