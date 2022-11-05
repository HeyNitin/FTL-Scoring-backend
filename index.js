const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');
app.use(cors());


app.get('/:names/:gameweek/:exact', async (req, res) => {
  const { names, gameweek, exact } = req.params
  const found = {}

  const players = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/')

  const localNames = names.split(' ').filter(item => item !== '').map(item => item.includes('_') ? item.split('_').join(' ') : item)
  
  localNames.sort((a,b)=>b.length - a.length)

  const localPlayers = players.data.elements.filter(item => {
    for (let name of localNames) {
      found[name] = found[name] === true
      if (exact === 'true') {
        if (item.web_name.toLowerCase() === name.toLowerCase()) {
          found[name] = true
          return true
        }
      } else {
        if ((item.web_name.toLowerCase()+' '+item.first_name.toLowerCase()+' '+item.second_name.toLowerCase()).includes(name.toLowerCase())) {
          found[name] = true
          return true
        }
      }
    }

    return false
  })

  let response = await localPlayers.reduce(async (res, item) => {
    const result = await axios.get(`https://fantasy.premierleague.com/api/element-summary/${item.id}/`)
    return [...await res, { player: item, points: result.data.history.find(item => item.round === ~~gameweek) ?? { total_points: 0, bonus: 0, minutes: 0 } }]
  }, [])

  res.send({ response, notFound: Object.keys(found).filter(item => !found[item]) })
})

app.listen(3000, () => {
  console.log('Server Started')
})