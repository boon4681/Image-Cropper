import ReactDOMServer from 'react-dom/server'
import App from './App'

export default () => {
    return ReactDOMServer.renderToString(<App />)
}