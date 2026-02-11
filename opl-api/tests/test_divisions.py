def test_get_divisions_empty(client):
    response = client.get('/divisions/')
    assert response.status_code == 200
    assert response.json() == []


def test_get_divisions(client, sample_division):
    response = client.get('/divisions/')
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['name'] == 'Division A'


def test_get_division_by_id(client, sample_division):
    response = client.get(f'/divisions/{sample_division.division_id}/')
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'Division A'
    assert data['start_date'] == '2025-01-01'


def test_get_division_not_found(client):
    response = client.get('/divisions/999/')
    assert response.status_code == 404


def test_create_division(client):
    response = client.post(
        '/divisions/',
        json={
            'name': 'Division B',
            'start_date': '2025-07-01',
            'end_date': '2025-12-01',
            'match_time': '20:00',
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'Division B'
    assert data['division_id'] is not None


def test_update_division(client, sample_division):
    response = client.put(
        f'/divisions/{sample_division.division_id}/',
        json={
            'name': 'Division A - Updated',
            'start_date': '2025-01-01',
            'end_date': '2025-06-30',
            'match_time': '19:30',
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'Division A - Updated'
    assert data['match_time'] == '19:30'
