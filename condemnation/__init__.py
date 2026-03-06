"""
condemnation/
-------------
Bug fix + feature extension package for SafeRoute.

Modules:
    routing_profiles  - Bug Fix #1: correct OSRM profiles per commuter type
    autocomplete      - Bug Fix #2: location suggestion JS + backend helpers
    form_state        - Bug Fix #3: form repopulation after POST

Import example:
    from condemnation.routing_profiles import build_osrm_url, is_train_type
    from condemnation.autocomplete     import get_suggest_js, validate_suggest_response
    from condemnation.form_state       import extract_form_state, get_empty_form_state, get_commuter_options

Nothing in this package auto-executes on import.
"""
