browser.contextMenus.create({
    "title": weh._("mark_all_menu"),
    "type": "normal",
    "contexts":["page"],
    "id": "linkvisitor-markall"
});

browser.contextMenus.create({
    "title": weh._("visited"),
    "type": "normal",
    "contexts":["page"],
    "id": "linkvisitor-markall-visited",
    "parentId": "linkvisitor-markall"
});

browser.contextMenus.create({
    "title": weh._("unvisited"),
    "type": "normal",
    "contexts":["page"],
    "id": "linkvisitor-markall-unvisited",
    "parentId": "linkvisitor-markall"
});

browser.contextMenus.create({
    "title": weh._("mark_selected_menu"),
    "type": "normal",
    "contexts":["selection"],
    "id": "linkvisitor-markselected"
});

browser.contextMenus.create({
    "title": weh._("visited"),
    "type": "normal",
    "contexts":["selection"],
    "id": "linkvisitor-markselected-visited",
    "parentId": "linkvisitor-markselected"
});

browser.contextMenus.create({
    "title": weh._("unvisited"),
    "type": "normal",
    "contexts":["selection"],
    "id": "linkvisitor-markselected-unvisited",
    "parentId": "linkvisitor-markselected"
});

browser.contextMenus.create({
    "title": weh._("toggle_link"),
    "type": "normal",
    "contexts":["link"],
    "id": "linkvisitor-togglelink"
});


function toggleLink(link, tab) {
    if (link && link.url && !link.url.startsWith('javascript:')) {
        browser.history.search({
                text: link.url,
                startTime: 0,
                maxResults: 1
            })
        .then(function(items) {
            if (items && items.length === 1) {
                if (weh.prefs.debug) {
                    console.log('Toggling Link -> unvisited:', link.url);
                }
                return browser.history.deleteUrl({url: link.url})
                    .then(null, function(err) {
                        console.error(err);
                    });
            }
            else {
                if (weh.prefs.debug) {
                    console.log('Toggling Link -> visited:', link.url);
                }
                return browser.history.addUrl({url: link.url})
                    .then(null, function(err) {
                        console.error(err);
                    });
            }
        })
        .then(function() {
            browser.tabs.sendMessage(tab.id, {type: "linkvisitor-refreshlink", url: link.url});
        });
    }
}

var updateJobs = {};

function stopMarking(tab) {
    var job = updateJobs[tab.id];
    if (job) {
        if (weh.prefs.debug) {
            console.log('Stopping mark link job on tab:', tab.id);
        }
        window.clearTimeout(job.timeout_id);
        job.next = job.links.length;

        var progress = {
            item: job.links.length,
            total: job.links.length,
            cancelled: true
        };

        browser.tabs.sendMessage(tab.id, {type: "linkvisitor-refreshlink",
                progress: progress
            })
            .then(null, function(err) {});

        delete updateJobs[tab.id];
    }
}

function visitLink(link) {
    if (weh.prefs.debug) {
        console.log('Adding url:', link.url);
    }
    return browser.history.addUrl( {url: link.url})
            .then(function() { return true; },
                function(err) {
                console.error(err, link, items);
            });
}

function unvisitLink(link) {
    if (weh.prefs.bookmarksVisited && browser.bookmarks) {
        return browser.bookmarks.search({url: link.url})
            .then(function(items) {
                if (!items || items.length === 0) {
                    if (weh.prefs.debug) {
                        console.log('Removing url:', link.url);
                    }
                    return browser.history.deleteUrl({url: link.url})
                            .then(function() { return true; },
                                function(err) {
                                console.error(err);
                            });
                }
                else {
                    if (weh.prefs.debug) {
                        console.log('Skipping bookmarked url:', link.url);
                    }
                    return false;
                }
            }, function(err) {
                console.error(err);
            });
    }
    else {
        if (weh.prefs.debug) {
            console.log('Removing url:', link.url);
        }
        return browser.history.deleteUrl({url: link.url})
                .then(function() { return true; },
                    function(err) {
                    console.error(err);
                });
    }
}

function nextLink(job) {
    var link = job.links[job.next++];
    link.progress = {
        item: job.next,
        total: job.links.length
    };

    var promise;
    if (weh.prefs.skipCheck) {
        promise = link.visit ? visitLink(link) : unvisitLink(link);
    }
    else {
        promise = browser.history.search({
                text: link.url,
                startTime: 0,
                maxResults: 1
            })
            .then(function(items) {
                if (link.visit && (!items || items.length === 0)) {
                    return visitLink(link);
                }
                else if (!link.visit && items && items.length === 1) {
                    return unvisitLink(link)
                }
                else {
                    return false;
                }
            }, function(err) {
                console.error(err);
            });
    }

    promise.then(function(modified) {
            browser.tabs.sendMessage(job.tab_id, {type: "linkvisitor-refreshlink",
                url: modified ? link.url : undefined,
                progress: link.progress
            })
            .then(null, function(err) {
                // assume tab has gone,   stop processing
                stopMarking({id: job.tab_id});
            });
            return true;
        })
        .then(function() {
            if (job.next >= job.links.length) {
                delete updateJobs[job.tab_id];
            }
            else {
                job.timeout_id = window.setTimeout(nextLink, weh.prefs.delay, job);
            }
            
            return true;
        }, 
            function(err) {
                console.error(err);
                stopMarking({id: job.tab_id});
            }
        );
}

function startMarking(type, tab) {

    var idx = type.lastIndexOf('-');
    var message = {
        type: type.substr(0, idx),
        visit: type.substr(idx + 1) === 'visited'
    };
    
    //fetch the links from the active tab    
    browser.tabs.sendMessage(tab.id, message)
        .then(function(linkInfo) {
            if (linkInfo.links.length === 0) {
                return;
            }
            
            var job = updateJobs[tab.id];
            var newJob = job == null;
            
            if (!job) {
                job = {
                    tab_id: tab.id,
                    links: [],
                    next: 0
                };
                
                updateJobs[tab.id] = job;
            }
            
            for (var i = 0; i < linkInfo.links.length; ++i) {
                job.links.push({url: linkInfo.links[i].url, visit: linkInfo.visit});
            }
            
            if (newJob) {
                if (weh.prefs.debug) {
                    console.log('Start new job on tab:', job.tab_id, ' - ', job.links.length, ' links to process');
                }
                job.timeout_id = window.setTimeout(nextLink, 0, job);
            }
            else if (weh.prefs.debug) {
                console.log('Added ', linkInfo.links.length, ' links to job for tab: ', job.tab_id);
            }
        });

}

browser.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
        default:
            return;
            
        case "linkvisitor-togglelink":
            toggleLink({url: info.linkUrl}, tab);
            break;
            
        case "linkvisitor-stop":
            stopMarking(tab);
            break;
            
        case "linkvisitor-markall-visited":
        case "linkvisitor-markall-unvisited":
        case "linkvisitor-markselected-visited":
        case "linkvisitor-markselected-unvisited":
            startMarking(info.menuItemId, tab);
            break;
    }
});

function handleMessage(message, window) {
    var query_params = {
        active: true,
        url: ["http://*/*", "https://*/*"],
        windowId: window.id
    };

    switch(message.type) {
        case "linkvisitor-togglelink":
            browser.tabs.query(query_params)
                .then(function(tabs) {                    
                    if (tabs && tabs.length) {
                        toggleLink(message, tabs[0]);
                    }
                }, function(err) {
                    console.error(err);
                });
            break;

        case "linkvisitor-markall-visited":
        case "linkvisitor-markall-unvisited":
            browser.tabs.query(query_params)
                .then(function(tabs) {                    
                    if (tabs && tabs.length) {
                        startMarking(message.type, tabs[0]);
                    }
                }, function(err) {
                    console.error(err);
                });
            return true;
            
        case "linkvisitor-stop":
            browser.tabs.query(query_params)
                .then(function(tabs) {
                    if (tabs && tabs.length) {
                        stopMarking(tabs[0]);
                    }
                });
            return true;
    }
    
    return false;
}


browser.runtime.onMessage.addListener(function(request, sender, response) {
    browser.windows.getCurrent()
        .then(function(window) {
            response(handleMessage(request, window));
        });
});

browser.commands.onCommand.addListener(function(command) {
    browser.windows.getCurrent()
        .then(function(window) {
            handleMessage({type: command}, window);
        });
});


weh.ui.update("default",{
    type: "popup",
    onMessage: function(message) {
        switch(message.type) {
            case "open-settings":
                weh.ui.close("default");
                weh.ui.open("settings");
                break;

            case "linkvisitor-markall-visited":
            case "linkvisitor-markall-unvisited":
            case "linkvisitor-stop":
                weh.ui.close("default");
                browser.windows.getCurrent({})
                    .then(function(window) {
                        handleMessage(message, window);
                    });
                break;
        }
    }
});

weh.ui.update("settings",{
    type: "tab",
    contentURL: "content/settings.html"
});

// var cssOverride = ["a:visited, a:visited * { color: ", null, " !important; }"];
var cssOverride = ["overrideVisitedColour(\'", null, "\');"];
var exceptions = {};

function updateExceptions(entries) {
    exceptions = {}
    entries = entries.split(',');
    for (var e in entries) {
        var index = entries[e].indexOf(':');
        var colour;
        var site;
        
        if (index > -1) {
            colour = entries[e].substring(index + 1).trim();
            site = entries[e].substring(0, index).trim();
        }
        else {
            colour = null;
            site = entries[e];
        }
        
        exceptions[site] = colour;    
    }
}

if (weh.prefs.overrideExceptions) {
    updateExceptions(weh.prefs.overrideExceptions);
}

function getHostColour(url) {
    var colour = weh.prefs.overrideColour;
    var hostname = (new URL(url)).hostname;
    
    if (exceptions[hostname] !== undefined) {
        colour = exceptions[hostname];
    }
    else {
        // see if we're a subdomain of an exception.
        for (var h in exceptions) {
            if (exceptions.hasOwnProperty(h) && hostname.endsWith(h)) {
                colour = exceptions[h];
                break;
            }
        }
    }
    
    return weh.prefs.doOverrideColour ? colour : undefined;
}

function updateTabOverride(tab) {
    if (tab.url.startsWith("http")) {
        var colour = getHostColour(tab.url);
        cssOverride[1] = colour || 'none';
        var css = cssOverride.join('');

        browser.tabs.executeScript(tab.id, {
            code: css
        })
        .then(null, function(err) {
            console.error(err);
        });
    }
}

function updateAllTabs(force) {
    browser.tabs.query({url: ["http://*/*", "https://*/*"]})
    .then(function(tabs) {
        for (var t in tabs) {
            updateTabOverride(tabs[t], force);
        }
    });
}

weh.prefs.on('overrideExceptions', function() {
    updateExceptions(weh.prefs.overrideExceptions);
    updateAllTabs();
});

weh.prefs.on('doOverrideColour', function() {
    updateAllTabs();
});

weh.prefs.on('overrideColour', function() {
    updateAllTabs();
});


browser.tabs.onUpdated.addListener(function(tab_id, change_info, tab_info) {
    //whenever a page change completes within a tab,  add our colour override
    if (tab_info.url.startsWith("http") && change_info.status === "complete" && weh.prefs.doOverrideColour) {
        updateTabOverride(tab_info);
    }
    
    return true;
});

// when we load,  make sure all tabs have our color override
if (weh.prefs.doOverrideColour) {
    updateAllTabs();
}
