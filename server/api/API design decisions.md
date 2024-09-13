# Web app API design decisions

Each endpoint delegates most of its functionality to a 'handler' in order that the effects can be unit tested. This is because seemingly there is no way in Nuxt to directly invoke a endpoint for a unit test, so one has to run up a whole server (a la the integration tests) and it would be difficult to do zoomed in unit tests on small pieces of code unless we provide them as separate utility functions.
