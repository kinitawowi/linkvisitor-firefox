
class Link extends React.Component {

    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        weh.post({
            type: this.props.messageType
        });
    }

    render() {
        return (
            <a onClick={this.handleClick}>{weh._(this.props.label)}</a>
        )
    }
}

ReactDOM.render (
    <div>
        <div className="linkvisitor-menu">
            <Link messageType={"linkvisitor-markall-visited"} label={"mark_all_visited"}/>
            <Link messageType={"linkvisitor-markall-unvisited"} label={"mark_all_unvisited"}/>
            <Link messageType={"linkvisitor-stop"} label={"stop"}/>
        </div>
    </div>,
    document.getElementById('root')
)
