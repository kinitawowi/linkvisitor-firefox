
function Prefs() {
    return (
        <WehParams>
            <WehVersion/>
            <WehParamSet wehPrefs={[
//                 "debug",
                "bookmarksVisited",
                "doOverrideColour",
                "overrideColour",
                "overrideExceptions"]}>
                <WehParam/>
            </WehParamSet>
        </WehParams>
    )
}

ReactDOM.render (
    <Prefs/>,
    document.getElementById('root')
)

weh.setPageTitle(weh._("title") + ' ' + weh._("settings"));
