
weh.prefs.declare([{
    name: "debug",
    type: "boolean",
    defaultValue: false
},{
    name: "bookmarksVisited",
    type: "boolean",
    defaultValue: false
},{
    name: "doOverrideColour",
    type: "boolean",
    defaultValue: false
},{
    name: "overrideColour",
    type: "string",
    defaultValue: "",
    maxLength: 50,
    regexp: "(^$|^[a-zA-Z ]+$|^#[0-9A-Fa-f]{6}$)"
},{
    name: "overrideExceptions",
    type: "string",
    defaultValue: "",
}]);


/* 
    "options_ui": {
        "page": "content/settings.html?panel=preferences",
        "browser_style": true
    },
*/
