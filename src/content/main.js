/*content code*/

function overrideVisitedColour(colour) {   
    var style = document.getElementById("linkvisitor_override");    
    if (style == null && colour.length > 0) {
        style = document.createElement("style");
        
        if (style != null) {
            style.setAttribute("id", "linkvisitor_override");
            style.setAttribute("type", "text/css");
        }
    
        var heads = document.getElementsByTagName("head");
        if(heads != null && heads.length > 0)
            heads[0].appendChild(style);
        else
            document.documentElement.appendChild(style);
    }
    
    if (colour.length > 0 && colour !== 'none') {
    style.textContent = "a:visited, a:visited * { color: " + colour + " !important; }";
    }
    else if (style != null) {
    style.textContent = "";
    }
}
/*
function markAll(visit) {
    browser.runtime.sendMessage({type: 'linkvisitor-markall-' + (visit ? 'visited' : 'unvisited')})
}

function markSelected(visit) {
    browser.runtime.sendMessage({type: 'linkvisitor-markselected-' + (visit ? 'visited' : 'unvisited')})
}

function toggleLink(link) {
    if (link && link.href) {
        browser.runtime.sendMessage({type: 'linkvisitor-togglelink', url: link.href})
    }
}
*/

(function() {

function getSelectedLinks() {
    var selection =  window.getSelection();
    var links = [];
       
    if (document.links && document.links.length > 0 && String(selection).length > 0)
    {   
        for (var i = 0; i < document.links.length; i++) {
            var link = document.links[i];
            if (selection.containsNode(link, true)) {
                links.push(link);
            }
        }
    }
    
    return links;
}

function getSafeLinks(links) {
    var safeLinks = new Array(links.length);
    
    for(var i = 0; i < links.length; ++i) {
        safeLinks[i] = {url: links[i].href};
    }
    
    return safeLinks;
}

function getLink(url) {    
    var link;

    if (document.links && document.links.length > 0) {
        for (var i = 0; i < document.links.length; i++) {
            link = document.links[i];
            if (link.href === url) {
                break;
            }
        }
    }

    return link;
}

function refreshLink(link) {
    window.setTimeout(function() {
        var href = link.href;
        link.href = '';
        link.href = href;
    }, 100);
};


browser.runtime.onMessage.addListener(function(message, sender, response) {
    var result;
    
    switch (message.type) {
        default:
            result = false;
            break;
            
        case "linkvisitor-refreshlink":
            refreshLink(getLink(message.url));
            result = true;
            break;
            
        case "linkvisitor-markall":
            result = {
                links: getSafeLinks(document.links),
                visit: message.visit
            };
            break;
            
        case "linkvisitor-markselected":
            result = {
                links: getSafeLinks(getSelectedLinks()),
                visit: message.visit
            };
            break;
    }

    response(result);
});

})();