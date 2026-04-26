# Metadata API

## Get music platforms metadata and links

<mark style="color:blue;">`GET`</mark> `https://eu-api-v2.acrcloud.com/api/external-metadata/tracks`

You can get metadata and links from the platforms(Spotify, Apple Music, Youtube, Deezer, Tidal, Gaana, AWA, KKBOX, SoundCloud)

You can test on [this page](https://console.acrcloud.com/metadata-links?#/reference).

#### Query Parameters

| Name          | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source_url    | String | <p>the platform's url, for example::<br><a href="https://www.youtube.com/watch?v=5UMCrq-bBCg"><https://www.youtube.com/watch?v=5UMCrq-bBCg></a><br><a href="https://open.spotify.com/track/1p80LdxRV74UKvL8gnD7ky"><https://open.spotify.com/track/1p80LdxRV74UKvL8gnD7ky></a><br><a href="https://www.deezer.com/track/1290892992"><https://www.deezer.com/track/1290892992></a><br><a href="https://http/www.tidal.com/track/100366314"><br></a></p> |
| isrc          | String | ISRC                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| acr_id        | String | ACRCloud Music ID                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| platforms     | String | <p>The platform's metadata you want to get.<br>for example:<br>spotify,youtube<br><br>The default value is: spotify,deezer,youtube,applemusic<br><br>The number of platforms in the platforms parameter of a single request cannot exceed 5.</p>                                                                                                                                                                                                       |
| query         | String | <p>Your search query, text format example: Eminem - Without Me<br><br>json format example( need to stringify the json data):<br>{"track":"Without Me", "artists":\["Eminem"]}</p>                                                                                                                                                                                                                                                                      |
| include_works | Number | 1 or 0, if you set it to 1, the response metadata will contain the contributors and works metadata if the tracks have                                                                                                                                                                                                                                                                                                                                  |
| format        | String | query string format, text or json. Default value is text                                                                                                                                                                                                                                                                                                                                                                                               |

#### Headers

| Name                                            | Type   | Description                                                                                          |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Authorization<mark style="color:red;">\*</mark> | String | Bearer token. [How to create the token](https://docs.acrcloud.com/reference/console-api/accesstoken) |

{% tabs %}
{% tab title="200: OK " %}

```json
{
  "data": [
    {
      "name": "Blank Space",
      "disc_number": 1,
      "track_number": 6,
      "isrc": "USCJY1431309",
      "genres": ["Pop", "Music"],
      "duration_ms": 230760,
      "release_date": "2014-01-01",
      "artists": [
        {
          "name": "Taylor Swift"
        }
      ],
      "album": {
        "track_count": 20,
        "upc": "00602577145735",
        "release_date": "2018-10-26",
        "label": "NOW20thAnniversary",
        "cover": "https://is3-ssl.mzstatic.com/image/thumb/Music124/v4/0b/ae/32/0bae3256-7bb0-82f9-35f8-bca634c4aae8/18UMGIM62497.rgb.jpg/3000x3000bb.jpg",
        "covers": {
          "small": "https://is3-ssl.mzstatic.com/image/thumb/Music124/v4/0b/ae/32/0bae3256-7bb0-82f9-35f8-bca634c4aae8/18UMGIM62497.rgb.jpg/64x64bb.jpg",
          "medium": "https://is3-ssl.mzstatic.com/image/thumb/Music124/v4/0b/ae/32/0bae3256-7bb0-82f9-35f8-bca634c4aae8/18UMGIM62497.rgb.jpg/300x300bb.jpg",
          "large": "https://is3-ssl.mzstatic.com/image/thumb/Music124/v4/0b/ae/32/0bae3256-7bb0-82f9-35f8-bca634c4aae8/18UMGIM62497.rgb.jpg/3000x3000bb.jpg"
        }
      },
      "external_metadata": {
        "applemusic": [
          {
            "id": "1437689373",
            "link": "https://music.apple.com/us/album/blank-space/1437689355?i=1437689373",
            "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/b7/20/d4/b720d476-169f-d94e-1bed-7d91d43f2883/mzaf_12311605322954569753.plus.aac.p.m4a",
            "artists": [
              {
                "id": "159260351"
              }
            ],
            "album": {
              "id": "1437689355",
              "cover": "https://is3-ssl.mzstatic.com/image/thumb/Music124/v4/0b/ae/32/0bae3256-7bb0-82f9-35f8-bca634c4aae8/18UMGIM62497.rgb.jpg/3000x3000bb.jpg"
            }
          },
          {
            "id": "1440933517",
            "link": "https://music.apple.com/us/album/blank-space/1440933512?i=1440933517",
            "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/81/bf/3d/81bf3ddc-75c0-46a3-d85b-9e79f0641a41/mzaf_2416740226777406648.plus.aac.p.m4a",
            "artists": [
              {
                "id": "159260351"
              }
            ],
            "album": {
              "id": "1440933512",
              "cover": "https://is2-ssl.mzstatic.com/image/thumb/Music124/v4/54/45/87/544587c8-3f71-8484-3fdb-186a7d7b7326/00843930013609.rgb.jpg/2400x2400bb.jpg"
            }
          },
          {
            "id": "1445765740",
            "link": "https://music.apple.com/us/album/blank-space/1445765736?i=1445765740",
            "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/20/3b/f8/203bf8a6-4f53-8e6b-ec00-8afd01241ebe/mzaf_2559055475772421277.plus.aac.p.m4a",
            "artists": [
              {
                "id": "159260351"
              }
            ],
            "album": {
              "id": "1445765736",
              "cover": "https://is5-ssl.mzstatic.com/image/thumb/Music124/v4/b2/38/d3/b238d354-1aec-f71b-8706-26fcb1738b6d/00843930039562.rgb.jpg/3000x3000bb.jpg"
            }
          }
        ],
        "deezer": [
          {
            "id": "89077521",
            "link": "https://www.deezer.com/track/89077521",
            "artists": [
              {
                "id": 12246
              }
            ],
            "album": {
              "id": 9007779,
              "cover": "https://api.deezer.com/2.0/album/9007779/image"
            }
          }
        ],
        "youtube": [
          {
            "id": "dC9QIUKviJU",
            "link": "https://music.youtube.com/watch?v=dC9QIUKviJU",
            "artists": [
              {
                "id": "UCPC0L1d253x-KuMNwa05TpA",
                "link": "https://music.youtube.com/channel/UCPC0L1d253x-KuMNwa05TpA"
              }
            ],
            "album": {
              "id": "MPREb_JiAQrbUtBdP",
              "link": "https://music.youtube.com/browse/MPREb_JiAQrbUtBdP"
            }
          },
          {
            "id": "uakZpnmQGiE",
            "link": "https://music.youtube.com/watch?v=uakZpnmQGiE",
            "artists": [
              {
                "id": "UCPC0L1d253x-KuMNwa05TpA",
                "link": "https://music.youtube.com/channel/UCPC0L1d253x-KuMNwa05TpA"
              }
            ],
            "album": {
              "id": "MPREb_FqCrQJ3iwcD",
              "link": "https://music.youtube.com/browse/MPREb_FqCrQJ3iwcD"
            }
          },
          {
            "id": "QIfZAPkF7_M",
            "link": "https://music.youtube.com/watch?v=QIfZAPkF7_M",
            "artists": [
              {
                "id": "UCbhKnJtOmuOuaoY5hGwtYgA",
                "link": "https://music.youtube.com/channel/UCbhKnJtOmuOuaoY5hGwtYgA"
              }
            ],
            "album": {
              "id": "MPREb_jucl3t8hdEz",
              "link": "https://music.youtube.com/browse/MPREb_jucl3t8hdEz"
            }
          }
        ],
        "spotify": [
          {
            "id": "1437689373",
            "link": "https://music.apple.com/us/album/blank-space/1437689355?i=1437689373",
            "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/b7/20/d4/b720d476-169f-d94e-1bed-7d91d43f2883/mzaf_12311605322954569753.plus.aac.p.m4a",
            "artists": [
              {
                "id": "159260351"
              }
            ],
            "album": {
              "id": "1437689355",
              "cover": "https://is3-ssl.mzstatic.com/image/thumb/Music124/v4/0b/ae/32/0bae3256-7bb0-82f9-35f8-bca634c4aae8/18UMGIM62497.rgb.jpg/3000x3000bb.jpg"
            }
          }
        ]
      },
      "type": "track",
      "works": [
        {
          "iswc": "T9155554271",
          "contributors": [
            {
              "name": "MAX MARTIN",
              "ipi": 254380962,
              "roles": ["Composer"]
            },
            {
              "name": "SHELLBACK ",
              "ipi": 583608328,
              "roles": ["Composer"]
            },
            {
              "name": "SWIFT TAYLOR ALISON",
              "ipi": 454808047,
              "roles": ["Composer"]
            },
            {
              "name": "SONY/ATV TREE PUBLISHING ",
              "ipi": 425389934,
              "roles": ["Publisher"]
            },
            {
              "name": "TAYLOR SWIFT MUSIC ",
              "ipi": 497322918,
              "roles": ["Publisher"]
            }
          ],
          "name": "BLANK SPACE VOICE MEMO"
        },
        {
          "iswc": "T9156975165",
          "contributors": [
            {
              "name": "MAX MARTIN",
              "ipi": 254380962,
              "roles": ["Composer"]
            },
            {
              "name": "SHELLBACK ",
              "ipi": 583608328,
              "roles": ["Composer"]
            },
            {
              "name": "SWIFT TAYLOR ALISON",
              "ipi": 454808047,
              "roles": ["Composer"]
            },
            {
              "name": "MXM MUSIC AB ",
              "ipi": 657349509,
              "roles": ["Publisher"]
            },
            {
              "name": "SONY/ATV TREE PUBLISHING ",
              "ipi": 425389934,
              "roles": ["Publisher"]
            },
            {
              "name": "KMR MUSIC ROYALTIES II SCSP ",
              "ipi": 858735976,
              "roles": ["Publisher"]
            },
            {
              "name": "TAYLOR SWIFT MUSIC ",
              "ipi": 497322918,
              "roles": ["Publisher"]
            }
          ],
          "name": "BLANK SPACE VOICE MEMO"
        },
        {
          "iswc": "T9236690770",
          "contributors": [
            {
              "name": "MAX MARTIN",
              "ipi": 254380962,
              "roles": ["Composer"]
            },
            {
              "name": "SCHUSTER JOHAN KARL",
              "ipi": 444712759,
              "roles": ["Composer"]
            },
            {
              "name": "SWIFT TAYLOR ALISON",
              "ipi": 454808047,
              "roles": ["Composer"]
            },
            {
              "name": "PAYAMI ALI",
              "ipi": 473985994,
              "roles": ["Composer"]
            }
          ],
          "name": "BLANK SPACE/STYLE"
        }
      ]
    }
  ]
}
```

{% endtab %}
{% endtabs %}

{% tabs %}
{% tab title="Python" %}

```python

import requests

url = "https://eu-api-v2.acrcloud.com/api/external-metadata/tracks"
payload={}
headers = {
  'Authorization': 'Bearer your token'
}
params = {
   'query':json.dumps({"track": "jus sayin", "artists": ["steve lawler","Dateless"]}),
   'format':'json'
}
response = requests.get(url, headers=headers, params=params)

print(response.text)
```

{% endtab %}

{% tab title="NodeJs - Axios" %}

```javascript
const axios = require('axios');

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'https://eu-api-v2.acrcloud.com/api/external-metadata/tracks',
  params: {
    query: JSON.stringify({
      track: 'jus sayin',
      artists: ['steve lawler', 'Dateless']
    }),
    format: 'json'
  },
  headers: {
    Authorization: 'Bearer YOUR_TOKEN'
  }
};

axios
  .request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });
```

{% endtab %}
{% endtabs %}
