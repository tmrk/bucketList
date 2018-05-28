'use strict';

// Tag generator, syntax: t('tag#id.class|attribute=value', content/[content], {'event': function() {...})
function t(tag, content, listener) {
    var el = document.createElement(tag.split('#')[0].split('.')[0].split('|').shift());
    if (tag.split('#')[1]) el.id = tag.split('#')[1].split('.')[0].split('|')[0];
    if (tag.split('.')[1]) el.classList.add(...tag.split('.').slice(1).join('.').split('|')[0].split('.'));
    if (tag.split('|')[1]) {
        var attrTemp = tag.split('|').slice(1);
        for (var i = 0; i < attrTemp.length; i++) el.setAttribute(attrTemp[i].split('=')[0], attrTemp[i].split('=')[1]);
    }
    if (content) {
        if (typeof content === 'string') el.insertAdjacentHTML('beforeend', content);
        else if (content.constructor === Array) for (var i = 0; i < content.length; i++) {
            if (typeof content[i] === 'string') el.insertAdjacentHTML('beforeend', content[i]);
            else el.appendChild(content[i]);
        }
        else el.appendChild(content);
    }
    if (listener) for (var event in listener) if (listener.hasOwnProperty(event)) el.addEventListener(event, listener[event]);
    return el;
}

fetch('countries.json')
    .then(response => response.text())
    .then(function(response) {
        var countries = JSON.parse(response),
            filtered = [],
            visited = [];
        document.body.removeChild(document.getElementById('loading'));
        document.body.classList.add('notouch');

        function addVisited(country, displayOnly) {
            var alpha2code = country.alpha2code;
            visited.push(country);
            document.getElementById('visited').appendChild(t('li#visited-' + alpha2code + '|data-countrycode=' + alpha2code, [
                country.shortnameen,
                t('span', ' [remove]', {'click': function() {
                    removeVisited(this.parentNode.getAttribute('data-countrycode'));
                    updateCounter();
                }})
            ]));
            countries.splice(getCountry(alpha2code, countries, true), 1); // removing country from pool

            // sort visited countries
            var list = document.getElementById('visited'),
            i, switching, b, shouldSwitch;
            switching = true;
            while (switching) {
              switching = false;
              b = list.getElementsByTagName('li');
              for (i = 0; i < (b.length - 1); i++) {
                shouldSwitch = false;
                if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
                  shouldSwitch = true;
                  break;
                }
              }
              if (shouldSwitch) {
                b[i].parentNode.insertBefore(b[i + 1], b[i]);
                switching = true;
              }
            }

            clearSearch();
            updateCounter();
            focusSearch();
        }

        function removeVisited(alpha2code) {
            countries.push(getCountry(alpha2code, visited)); // put country back to the pool
            visited.splice(getCountry(alpha2code, visited, true), 1);
            document.getElementById('visited').removeChild(document.getElementById('visited-' + alpha2code));
            focusSearch();
        }

        function clearSearch() {
            document.getElementById('search').value = '';
            document.getElementById('hints').innerHTML = ''
        }

        function focusSearch() {
            document.getElementById('search').focus();
        }

        function getCountry(alpha2code, array, indexOnly) {
            var array = array || countries,
                index,
                country;
            for (var i = 0; i < array.length; i++) {
                if (array[i].alpha2code === alpha2code) {
                    index = i;
                    country = array[i];
                    break;
                }
            }
            return indexOnly ? index : country;
        }

        function updateCounter() {
            var counter = document.getElementById('counter');
            if (visited.length) {
                var numIndependent = 0;
                for (var i = 0; i < visited.length; i++) {
                    if (visited[i].independent) numIndependent++;
                }
                counter.innerHTML = visited.length + ' countries visited ('
                    + numIndependent + ' independent)';
                localStorage.setItem('visitedCountries', JSON.stringify(visited));
            }
            else counter.innerHTML = '';
        }

        document.body.appendChild(
            t('div#wrapper', [
                t('div#searchwrapper', [
                    t('input#search|placeholder=Type a country to add|autofocus=autofocus|autocomplete=off', '', {'input': function() {
                        var hints = document.getElementById('hints');
                        if (this.value) {
                            filtered = countries.filter(function(c) {
                                return c.shortnameen.toLowerCase().startsWith(this.value.toLowerCase());
                            }, (this));
                            hints.innerHTML = '';
                            for (var i = 0; i < filtered.length; i++) {
                                hints.appendChild(t('li|data-countrycode=' + filtered[i].alpha2code, filtered[i].shortnameen, {'click': function() {
                                    addVisited(getCountry(this.getAttribute('data-countrycode')));
                                }}));
                            }
                            if (filtered.length) {
                                hints.firstChild.classList.add('selected');
                            }
                        } else hints.innerHTML = '';
                    }, 'keydown': function(e) {
                        var selected = document.getElementsByClassName('selected')[0];
                        switch (e.keyCode) {
                            case 13: // Enter
                                e.preventDefault();
                                if (this.value && filtered.length) {
                                    addVisited(getCountry(selected.getAttribute('data-countrycode')));
                                }
                                break;
                            case 40: // Down
                                e.preventDefault();
                                if (selected && selected.nextSibling) {
                                    selected.classList.remove('selected');
                                    selected.nextSibling.classList.add('selected');
                                    //if (selected.nextSibling.getBoundingClientRect().bottom - filtered.getBoundingClientRect().height - 80 >= 0) filtered.scrollTop = selected.nextSibling.offsetTop - filtered.getBoundingClientRect().height - selected.nextSibling.getBoundingClientRect().height - 7;
                                }
                                break;
                            case 38: // Up
                                e.preventDefault();
                                if (selected && selected.previousSibling) {
                                    selected.classList.remove('selected');
                                    selected.previousSibling.classList.add('selected');
                                    //if (selected.previousSibling.offsetTop - 80 <= filtered.scrollTop) filtered.scrollTop = selected.previousSibling.offsetTop - 80;
                                }
                                break;
                            case 27: // Escape
                                e.preventDefault();
                                clearSearch();
                                break;
                        }
                    }}),
                    t('ul#hints')
                ]),
                t('div#result', [
                    t('div#counter'),
                    t('ul#visited')
                ])
            ])

        )
        if (localStorage.getItem('visitedCountries')) {
            var visitedTemp = JSON.parse(localStorage.getItem('visitedCountries'));
            for (var i = 0; i < visitedTemp.length; i++) {
                addVisited(visitedTemp[i]);
                updateCounter();
            }
        }
    })
