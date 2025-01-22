from common import dashboard, fuzz, wait_for, write_test_code


def test_does_not_report_bug_for_xfail():
    test_dir, _db_dir = write_test_code(
        """
        @pytest.mark.xfail()
        @given(st.integers())
        def test_1(n):
            assert n != 0
        """
    )
    node_id = "test_a.py::test_1"
    with dashboard(test_path=test_dir) as dash, fuzz(test_path=test_dir):
        wait_for(lambda: node_id in dash.state()["latest"], timeout=5, interval=0.1)
        assert (
            "found a failure, but did not reproduce" in dash.state(id=node_id)["note"]
        )


def test_does_not_report_bug_for_custom_xfail():
    test_dir, _db_dir = write_test_code(
        """
        from functools import wraps

        def custom_xfail(f):
            @wraps(f)
            def wrapped(*args, **kwargs):
                try:
                    return f(*args, **kwargs)
                except Exception:
                    pass
            return wrapped

        @custom_xfail
        @given(st.integers())
        def test_1(n):
            assert n != 0
        """
    )
    node_id = "test_a.py::test_1"
    with dashboard(test_path=test_dir) as dash, fuzz(test_path=test_dir):
        wait_for(lambda: node_id in dash.state()["latest"], timeout=5, interval=0.1)
        assert (
            "found a failure, but did not reproduce" in dash.state(id=node_id)["note"]
        )


def test_does_not_report_bug_for_parameterized_xfail():
    test_dir, _db_dir = write_test_code(
        """
        @pytest.mark.xfail
        @pytest.mark.parametrize("param", [1, 2, 3])
        @given(n=st.integers())
        def test_1(param, n):
            assert n != 0
        """
    )
    # just check the middle parametrization for now
    node_id = "test_a.py::test_1[2]"
    with dashboard(test_path=test_dir) as dash, fuzz(test_path=test_dir):
        wait_for(lambda: node_id in dash.state()["latest"], timeout=5, interval=0.1)
        assert (
            "found a failure, but did not reproduce" in dash.state(id=node_id)["note"]
        )
