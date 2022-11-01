# This empty conftest.py file allows pytest to find source code without having to modify the
# PYTHONPATH variable.
#
# Due to the repository structure with the src directory, by default pytest would be unable to associate the
# imports from tests.
#
# Without conftest.py file:
# By default, pytest would expect the check_palindrome module import statement to be the following:
# `import src.project_name.check_palindrome`
#
# With conftest.py file:
# The conftest.py file is automatically found by pytest. With just a blank conftest.py file,
# pytest can now find the import as the following:
# `import project_name.check_palindrome`
#
# The conftest.py can also be used to further configure pytest settings, fixtures, etc.
# See https://docs.pytest.org/en/latest/writing_plugins.html#conftest-py-plugins and
# https://docs.pytest.org/en/latest/explanation/pythonpath.html#pythonpath for more info.
#
