
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
},{
    name: "skipCheck",
    type: "boolean",
    defaultValue: false
},{
    name: "delay",
    type: "integer",
    defaultValue: 10,
    minimum: 0
}]);
