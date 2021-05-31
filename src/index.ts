import cheerio from 'cheerio';
import { EventAttributes } from 'ics';
import fetch from 'node-fetch';
import writeICal from './helper/iCal/writeICal';

const VNL_URL = 'https://en.volleyballworld.com/';

type Gender = 'men' | 'women';

type WhatToScrap = Record<Gender, Array<string>>;

type PageTime = {
  timeutc: string
  timelocal: string
  utcDatetime: string
  myTimezone: string
}

const fetchVnlSchedulePage = async (teamPath: string) => fetch(`${VNL_URL}${teamPath}schedule/`);

const fetchLinksByGender = async (year: number, gender: Gender) => {
  const linksByCountry: Record<string, string> = {};
  const html = await fetch(`${VNL_URL}/volleyball/competitions/vnl-${year}/teams/${gender}/`);
  const $ = cheerio.load(await html.text());

  const teamAnchorElements = $('.vbw-team-list a');

  teamAnchorElements.toArray().forEach((link) => {
    const href = $(link).attr('href');
    const country = $(link).find('.vbw-mu__team__name--abbr').text();

    linksByCountry[country] = href;
  });
  
  return linksByCountry;
}

const run = async () => {
  const year = 2021;
  const countriesToScrap = [
    'JPN',
    'BRA',
    'NED',
  ];
  const whatToScrap: WhatToScrap = {
    women: countriesToScrap,
    men: countriesToScrap,
  };

  const events: Map<string, EventAttributes> = new Map();
  
  await Promise.all(
    Object
      .keys(whatToScrap)
      .map(async (gender: Gender) => {
        const links = await fetchLinksByGender(year, gender);

        const countries = whatToScrap[gender];
        await Promise.all(
          countries.map(async (country) => {
            const html = await fetchVnlSchedulePage(links[country]);
            const $ = cheerio.load(await html.text());

            const matchContainerElements = $('.vbw-mu--match.vbw-mu');
            matchContainerElements.toArray().forEach((match) => {
              const homeTeam = $(match).find('.vbw-mu__team.vbw-mu__team--home > .vbw-mu__team__name--abbr').text();
              const awayTeam = $(match).find('.vbw-mu__team.vbw-mu__team--away > .vbw-mu__team__name--abbr').text();
              const time: PageTime = $(match).find('.vbw-mu__time-wrapper').data();

              const date = new Date(time.utcDatetime);

              const event: EventAttributes = {
                start: [
                  date.getFullYear(),
                  date.getMonth() + 1,
                  date.getDate(),
                  date.getHours(),
                  date.getMinutes(),
                ],
                duration: { hours: 2 },
                title: `VNL ${gender.toUpperCase()} ${year}: ${homeTeam} vs ${awayTeam}`,
              }

              events.set(`${event.title}`, event);
            })
          })
        );
      })
  );

  // TODO: maybe straight to Google Calendar?
  writeICal(Array.from(events.values()), `vnl-${year}-schedule-${Date.now()}`);
}

// TODO: make it argumented
run()
  .then(() => {})
  .catch(() => {})