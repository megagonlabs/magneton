from flask import Response

DATABASE_503_RESPONSE_MESSAGE = "The database was unable to process your request."
DATABASE_503_RESPONSE = Response(response=DATABASE_503_RESPONSE_MESSAGE,
                                 status=503)
MAX_QUERY_LIMIT = 1000
DEFAULT_QUERY_LIMIT = 10


def SERVER_ERROR_500_RESPONSE(env, error=None):
    message = 'There was an server error. Please try again later. That\'s all we know.'
    if (env != 'production' and error is not None):
        message = 'Server Error: {}'.format(error)
    return Response(response=message, status=500)