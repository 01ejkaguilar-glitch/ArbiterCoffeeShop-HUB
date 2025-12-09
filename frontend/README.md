# Arbiter Coffee Shop - Frontend

React + Bootstrap frontend application for the Arbiter Coffee Shop management system.

## Color Scheme

- **Primary Black**: `#1A1A1A`
- **Dark Green**: `#006837`
- **Medium Green**: `#009245`
- **White**: `#FFFFFF`

## Tech Stack

- **React** 18.x - JavaScript library for building user interfaces
- **React Bootstrap** - Bootstrap components for React
- **React Router DOM** - Routing library for React
- **Axios** - HTTP client for API requests
- **Bootstrap** 5.x - CSS framework
- **React Icons** - Icon library

## Project Structure

```
src/
├── components/      # Reusable components
├── context/         # React Context providers
├── pages/           # Page components (public, auth, customer, admin)
├── services/        # API services
├── config/          # Configuration files
├── styles/          # Global styles
└── App.js           # Main App component
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm
- Running Laravel backend API at http://localhost:8000

### Installation & Development

1. Install dependencies (already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`

## Features

### Public Features
- Browse products and categories
- View product details
- Shopping cart (guest or authenticated)
- Contact form and About page

### Customer Features (Authenticated)
- User dashboard and profile management
- Order history and tracking
- Shopping cart and checkout
- Multiple payment methods (Cash, GCash, Maya)

### Admin Features (Admin Role)
- Dashboard with statistics
- Product, order, and user management
- Analytics and reports

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Environment Variables

Create a `.env` file (already created) with:
```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
