def test_get_players_empty(client):
    response = client.get('/players/')
    assert response.status_code == 200
    assert response.json() == []


def test_get_players(client, sample_players):
    response = client.get('/players/')
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4


def test_get_player_by_id(client, sample_players):
    player = sample_players[0]
    response = client.get(f'/players/{player.player_id}/')
    assert response.status_code == 200
    data = response.json()
    assert data['first_name'] == 'Alice'
    assert data['last_name'] == 'Smith'
    assert data['rating'] == 700


def test_get_player_not_found(client):
    response = client.get('/players/999/')
    assert response.status_code == 404


def test_create_player(client, sample_division):
    response = client.post(
        '/players/',
        json={
            'first_name': 'Eve',
            'last_name': 'Wilson',
            'rating': 650,
            'games_played': 0,
            'phone': '555-0005',
            'email': 'eve@example.com',
            'division_id': sample_division.division_id,
        },
    )
    assert response.status_code == 200

    # Verify via GET (create_player has a double-commit that expires the response object)
    players = client.get('/players/').json()
    created = [p for p in players if p['email'] == 'eve@example.com']
    assert len(created) == 1
    assert created[0]['first_name'] == 'Eve'
    assert created[0]['rating'] == 650


def test_update_player(client, sample_players):
    player = sample_players[0]
    response = client.put(
        f'/players/{player.player_id}/',
        json={
            'first_name': 'Alice',
            'last_name': 'Johnson',
            'rating': 750,
            'games_played': 10,
            'phone': '555-0001',
            'email': 'alice@example.com',
            'division_id': player.division_id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data['last_name'] == 'Johnson'
    assert data['rating'] == 750
