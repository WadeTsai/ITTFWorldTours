from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.common.by import By
import urllib.request
from bs4 import BeautifulSoup
import json

if __name__ == '__main__':
    event_ids = list(range(5000, 5012, 1)) + list(range(2816, 2826, 1))
    for event_id in event_ids:
        event_id = str(event_id)
        for group in ['MS', 'WS']:
            url = f'http://results.ittf.bornan.net/ittf-web-results/html/TTE{event_id}/results.html#/knock-outs'
            try:
                driver = webdriver.Chrome(executable_path='chromedriver.exe')
                driver.get(url)
                event_title = driver.find_element_by_class_name('page__title').text
                group_dic = {
                    'MS': "Men's Singles",
                    'WS': "Women's Singles"
                }
                print("Now is crawling", event_id, event_title, group_dic[group])

                for option in driver.find_elements_by_tag_name('option'):
                    if option.text == group_dic[group]:
                        option.click()
                if 'Grand Finals' not in event_title:
                    WebDriverWait(driver, 10).until(
                        expected_conditions.presence_of_element_located((By.CLASS_NAME, 'next'))
                        ).click()
                players = driver.find_elements_by_class_name('label')
                scores = driver.find_elements_by_class_name('score')
                game_list = []
                videos_dic = {'Event': event_title + ' ' + group_dic[group]}

                for i in range(15):
                    player1 = players[i*2].get_attribute('title').replace('^', '')
                    score1 = scores[i*2].text
                    player2 = players[i*2+1].get_attribute('title').replace('^', '')
                    score2 = scores[i*2+1].text
                    game = player1 + " " + score1 + ":" + score2 + " " + player2
                    game_list.append(game)
                    search = event_title.replace('Seamaster ', '')
                    search = search.replace('Liebherr ', '')
                    search = search.replace(' ITTF World Tour', '')
                    search = search.replace('ITTF World Tour', '2018')
                    search = search.replace(' Platinum', '')
                    search = search.replace('LIEBHERR ', '')
                    search = search.replace(' Hang Seng', '')
                    search = search = search.replace(',', '')
                    search = search.replace('  ', ' ')
                    search = search + ' ' + player1 + ' ' + player2
                    print("search for: " + search)
                    search = search.replace(' ', '+')
                    query = urllib.parse.quote(search)
                    request_url = 'https://www.youtube.com/results?search_query=' + query
                    response = urllib.request.urlopen(request_url)
                    html = response.read()
                    soup = BeautifulSoup(html, 'html.parser')
                    try:
                        VID = soup.find(attrs={'class': 'yt-uix-tile-link'}).get('href')[9:]
                    except:
                        VID = ''
                        print(search)
                        filename = event_id + '_' + group + '_' + player1 + '_' + player2 + '_soup.html' 
                        with open(filename, 'w', encoding='utf-8') as file:
                            file.write(str(soup))
                    if len(VID) > 11:
                        VID = ''
                    videos_dic.update({game : VID})

                tree_dic = {
                    "name": game_list[14],
                    "children": [{
                        "name": game_list[12],
                        "children": [{
                            "name": game_list[8],
                            "children": [
                                {"name": game_list[0]},
                                {"name": game_list[1]}
                            ]
                        }, {
                            "name": game_list[9],
                            "children": [
                                {"name": game_list[2]},
                                {"name": game_list[3]}
                            ]
                        }
                    ]}, {
                        "name": game_list[13],
                        "children": [{
                            "name": game_list[10],
                            "children": [
                                {"name": game_list[4]},
                                {"name": game_list[5]}
                            ]
                        }, {
                            "name": game_list[11],
                            "children": [
                                {"name": game_list[6]},
                                {"name": game_list[7]}
                            ]
                        }]
                    }]
                }

                with open(event_id + group + '_videos.json', 'w') as output:
                    json.dump(videos_dic, output, indent=4)
                
                with open(event_id + group + '_tree.json', 'w') as output:
                    json.dump(tree_dic, output, indent=4)

            finally:
                driver.quit()
