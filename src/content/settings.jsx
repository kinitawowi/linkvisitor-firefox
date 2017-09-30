
function Prefs() {
    return (
        <WehParams>
            <WehVersion/>
            <WehParamSet wehPrefs={[
//                 "debug",
                "bookmarksVisited",
                "doOverrideColour",
                "overrideColour",
                "overrideExceptions",
                "delay",
                "skipCheck"
                ]}>
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
