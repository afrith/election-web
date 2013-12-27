import psycopg2
from operator import itemgetter

hlparties = {
    'African National Congress': 'ANC',
    'Congress of the People': 'COPE',
    'Democratic Alliance': 'DA',
    'Inkatha Freedom Party': 'IFP'
}

conn = psycopg2.connect("dbname=elecweb")
cur = conn.cursor()

cur.execute("SELECT p.name, votes FROM admin a INNER JOIN votes v ON a.gid = area_gid INNER JOIN party p ON party_gid = p.gid WHERE ballot_gid = 0 AND a.code = 'RSA' ORDER BY votes DESC");
results = cur.fetchall()

total = sum(map(itemgetter(1), results))

print('<table class="votes">')
print('    <tr class="voteheader"><th>Party</th><th>Votes</th><th>Vote %</th></tr>')

for (party, votes) in results:
    if party in hlparties:
        print('    <tr class="%s">' % hlparties[party], end='')
    else:
        print('    <tr>', end='')
    print('<td>{}</td>'.format(party), end='')
    print('<td class="numbercell">{:,}</td>'.format(votes), end='')
    print('<td class="numbercell">{:0.1f}%</td>'.format((votes * 100.0)/total ), end='')
    print('</tr>')

print('</table>')
