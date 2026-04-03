const LOCATION_DIRECTORY = [
  {
    state: 'Uttar Pradesh',
    cities: [
      { name: 'Kanpur', areas: ['Swaroop Nagar', 'Kakadeo', 'Kidwai Nagar', 'Govind Nagar', 'Barra', 'Civil Lines', 'Kalyanpur', 'Shyam Nagar', 'Arya Nagar', 'Nawabganj', 'Tilak Nagar', 'Panki'] },
      { name: 'Lucknow', areas: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Alambagh', 'Mahanagar', 'Vikas Nagar', 'Chinhat'] },
      { name: 'Noida', areas: ['Sector 18', 'Sector 62', 'Sector 137', 'Sector 76', 'Sector 150', 'Greater Noida West'] },
      { name: 'Ghaziabad', areas: ['Indirapuram', 'Vaishali', 'Raj Nagar Extension', 'Crossings Republik', 'Kaushambi'] },
      { name: 'Agra', areas: ['Sanjay Place', 'Tajganj', 'Dayal Bagh', 'Kamla Nagar', 'Sikandra'] },
      { name: 'Varanasi', areas: ['Lanka', 'Sigra', 'Godowlia', 'Assi Ghat', 'Mahmoorganj'] },
      { name: 'Prayagraj', areas: ['Civil Lines', 'George Town', 'Naini', 'Allahpur', 'Jhunsi'] },
      { name: 'Meerut', areas: ['Shastri Nagar', 'Ganga Nagar', 'Sadar Bazaar', 'Partapur'] },
      { name: 'Ayodhya', areas: ['Faizabad Road', 'Devkali', 'Niyawan', 'Sahabganj'] },
      { name: 'Gorakhpur', areas: ['Golghar', 'Taramandal', 'Betiahata', 'Rustampur'] },
      { name: 'Aligarh', areas: ['Civil Lines', 'Ramghat Road', 'Center Point', 'Dodhpur'] },
      { name: 'Bareilly', areas: ['Civil Lines', 'Delapeer', 'Rajendra Nagar', 'Pilibhit Bypass'] },
      { name: 'Mathura', areas: ['Vrindavan Road', 'Krishna Nagar', 'Dampier Nagar', 'Govardhan Road'] },
      { name: 'Jhansi', areas: ['Civil Lines', 'Sipri Bazar', 'Nandanpura', 'Elite Crossing'] }
    ]
  },
  {
    state: 'Delhi',
    cities: [
      { name: 'New Delhi', areas: ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Saket', 'Dwarka', 'Rohini'] },
      { name: 'South Delhi', areas: ['Greater Kailash', 'Kalkaji', 'Hauz Khas', 'Malviya Nagar', 'Vasant Kunj'] },
      { name: 'East Delhi', areas: ['Preet Vihar', 'Laxmi Nagar', 'Mayur Vihar', 'Anand Vihar'] },
      { name: 'North Delhi', areas: ['Model Town', 'Civil Lines', 'Shalimar Bagh', 'Burari'] },
      { name: 'West Delhi', areas: ['Janakpuri', 'Punjabi Bagh', 'Rajouri Garden', 'Uttam Nagar'] }
    ]
  },
  {
    state: 'Maharashtra',
    cities: [
      { name: 'Mumbai', areas: ['Andheri', 'Bandra', 'Powai', 'Dadar', 'Borivali', 'Goregaon', 'Chembur', 'Lower Parel'] },
      { name: 'Pune', areas: ['Baner', 'Hinjewadi', 'Kothrud', 'Wakad', 'Viman Nagar', 'Magarpatta', 'Hadapsar'] },
      { name: 'Nagpur', areas: ['Dharampeth', 'Sitabuldi', 'Manish Nagar', 'Wardha Road', 'Pratap Nagar'] },
      { name: 'Nashik', areas: ['College Road', 'Gangapur Road', 'Panchavati', 'Indira Nagar'] },
      { name: 'Thane', areas: ['Ghodbunder Road', 'Majiwada', 'Kasarvadavali', 'Vartak Nagar'] },
      { name: 'Navi Mumbai', areas: ['Vashi', 'Nerul', 'Belapur', 'Airoli', 'Kharghar'] },
      { name: 'Aurangabad', areas: ['CIDCO', 'Jalna Road', 'Osmanpura', 'Beed Bypass'] },
      { name: 'Kolhapur', areas: ['Rajarampuri', 'Shahupuri', 'Tarabai Park', 'Ujalaiwadi'] },
      { name: 'Solapur', areas: ['Jule Solapur', 'Hotgi Road', 'Saat Rasta', 'Vijapur Road'] }
    ]
  },
  {
    state: 'Karnataka',
    cities: [
      { name: 'Bengaluru', areas: ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Jayanagar', 'Marathahalli', 'Electronic City', 'Hebbal'] },
      { name: 'Mysuru', areas: ['Vijayanagar', 'Hebbal', 'Kuvempunagar', 'Gokulam'] },
      { name: 'Mangaluru', areas: ['Kadri', 'Bejai', 'Surathkal', 'Kankanady'] },
      { name: 'Hubballi', areas: ['Vidyanagar', 'Gokul Road', 'Keshwapur', 'Deshpande Nagar'] },
      { name: 'Belagavi', areas: ['Tilakwadi', 'Shahapur', 'Vadgaon', 'Angol'] },
      { name: 'Mysuru Rural', areas: ['Srirampura', 'Jayalakshmipuram', 'Nazarbad', 'Bogadi'] },
      { name: 'Kalaburagi', areas: ['Sedam Road', 'Shah Bazar', 'Jewargi Road', 'Brahmapur'] }
    ]
  },
  {
    state: 'Tamil Nadu',
    cities: [
      { name: 'Chennai', areas: ['T Nagar', 'Anna Nagar', 'Velachery', 'Adyar', 'Porur', 'OMR', 'Nungambakkam', 'Tambaram'] },
      { name: 'Coimbatore', areas: ['RS Puram', 'Peelamedu', 'Saibaba Colony', 'Singanallur', 'Ganapathy'] },
      { name: 'Madurai', areas: ['Anna Nagar', 'KK Nagar', 'Tallakulam', 'Simmakkal'] },
      { name: 'Salem', areas: ['Fairlands', 'Hasthampatti', 'Ammapet', 'Alagapuram'] },
      { name: 'Tiruchirappalli', areas: ['Srirangam', 'Thillai Nagar', 'Cantonment', 'Woraiyur'] },
      { name: 'Tiruppur', areas: ['Avinashi Road', 'Kangayam Road', 'PN Road', 'Rakiyapalayam'] },
      { name: 'Erode', areas: ['Perundurai Road', 'Brough Road', 'Veerappanchatram', 'Thindal'] }
    ]
  },
  {
    state: 'Telangana',
    cities: [
      { name: 'Hyderabad', areas: ['Hitech City', 'Gachibowli', 'Banjara Hills', 'Kukatpally', 'Madhapur', 'Begumpet', 'Secunderabad'] },
      { name: 'Warangal', areas: ['Hanamkonda', 'Kazipet', 'Waddepally', 'Kakatiya Colony'] },
      { name: 'Nizamabad', areas: ['Vinayak Nagar', 'Bodhan Road', 'Tilak Garden', 'Arsapally'] },
      { name: 'Karimnagar', areas: ['Mankamma Thota', 'Kothirampur', 'Jyothi Nagar'] },
      { name: 'Khammam', areas: ['Wyra Road', 'Mamillagudem', 'Srinivas Nagar'] }
    ]
  },
  {
    state: 'Gujarat',
    cities: [
      { name: 'Ahmedabad', areas: ['Satellite', 'Navrangpura', 'Bopal', 'Maninagar', 'SG Highway', 'Prahlad Nagar'] },
      { name: 'Surat', areas: ['Adajan', 'Vesu', 'Katargam', 'Piplod', 'Athwa'] },
      { name: 'Vadodara', areas: ['Alkapuri', 'Gotri', 'Manjalpur', 'Vasna Road', 'Akota'] },
      { name: 'Rajkot', areas: ['Kalawad Road', 'University Road', 'Raiya Road', 'Yagnik Road'] },
      { name: 'Gandhinagar', areas: ['Sector 11', 'Sector 21', 'Kudasan', 'Raysan'] }
    ]
  },
  {
    state: 'Rajasthan',
    cities: [
      { name: 'Jaipur', areas: ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'C Scheme', 'Jagatpura', 'Tonk Road'] },
      { name: 'Jodhpur', areas: ['Sardarpura', 'Ratanada', 'Paota', 'Shastri Nagar'] },
      { name: 'Udaipur', areas: ['Fatehpura', 'Hiran Magri', 'Shobhagpura', 'Sukher'] },
      { name: 'Kota', areas: ['Talwandi', 'Vigyan Nagar', 'Kunhari', 'Mahaveer Nagar'] },
      { name: 'Ajmer', areas: ['Vaishali Nagar', 'Civil Lines', 'Adarsh Nagar', 'Pushkar Road'] }
    ]
  },
  {
    state: 'Madhya Pradesh',
    cities: [
      { name: 'Bhopal', areas: ['Arera Colony', 'MP Nagar', 'Kolar Road', 'Bawadia Kalan', 'Lalghati'] },
      { name: 'Indore', areas: ['Vijay Nagar', 'Palasia', 'Rajendra Nagar', 'Bhawarkuan', 'Scheme 140'] },
      { name: 'Gwalior', areas: ['City Centre', 'Morar', 'Lashkar', 'Thatipur'] },
      { name: 'Jabalpur', areas: ['Napier Town', 'Adhartal', 'Wright Town', 'Gorakhpur'] },
      { name: 'Ujjain', areas: ['Freeganj', 'Nanakheda', 'Mahakal Road', 'Vikram Nagar'] }
    ]
  },
  {
    state: 'West Bengal',
    cities: [
      { name: 'Kolkata', areas: ['Salt Lake', 'Park Street', 'Howrah', 'New Town', 'Garia', 'Ballygunge', 'Dum Dum'] },
      { name: 'Siliguri', areas: ['Sevoke Road', 'Matigara', 'Pradhan Nagar', 'Champasari'] },
      { name: 'Durgapur', areas: ['Bidhannagar', 'City Centre', 'Benachity', 'A-Zone'] },
      { name: 'Asansol', areas: ['Burnpur', 'Chelidanga', 'Shibpur', 'Court More'] },
      { name: 'Howrah', areas: ['Shibpur', 'Liluah', 'Santragachi', 'Belur'] }
    ]
  },
  {
    state: 'Andhra Pradesh',
    cities: [
      { name: 'Visakhapatnam', areas: ['MVP Colony', 'Gajuwaka', 'Dwaraka Nagar', 'Madhurawada', 'Siripuram'] },
      { name: 'Vijayawada', areas: ['Benz Circle', 'Gollapudi', 'Patamata', 'Auto Nagar', 'Moghalrajpuram'] },
      { name: 'Tirupati', areas: ['Renigunta', 'Balaji Colony', 'Air Bypass Road', 'Tiruchanur'] },
      { name: 'Kurnool', areas: ['Nandyal Checkpost', 'Budhawarpet', 'Sunkesula Road'] },
      { name: 'Guntur', areas: ['Brodipet', 'Amaravathi Road', 'Arundelpet', 'Lakshmipuram'] }
    ]
  },
  {
    state: 'Kerala',
    cities: [
      { name: 'Kochi', areas: ['Kakkanad', 'Edappally', 'MG Road', 'Fort Kochi', 'Kaloor'] },
      { name: 'Thiruvananthapuram', areas: ['Kowdiar', 'Technopark', 'Pattom', 'Kazhakkoottam', 'Vazhuthacaud'] },
      { name: 'Kozhikode', areas: ['Mavoor Road', 'Nadakkavu', 'Kallai', 'West Hill'] },
      { name: 'Thrissur', areas: ['Punkunnam', 'Ayyanthole', 'Viyyur', 'Ollur'] },
      { name: 'Kannur', areas: ['Talap', 'Pallikunnu', 'Thana', 'Payyambalam'] }
    ]
  },
  {
    state: 'Punjab',
    cities: [
      { name: 'Ludhiana', areas: ['Model Town', 'Pakhowal Road', 'Ferozepur Road', 'Dugri', 'Sarabha Nagar'] },
      { name: 'Amritsar', areas: ['Ranjit Avenue', 'Lawrence Road', 'GT Road', 'Majitha Road'] },
      { name: 'Jalandhar', areas: ['Urban Estate', 'Model Town', 'Nakodar Road', 'Mithapur'] },
      { name: 'Patiala', areas: ['Leela Bhawan', 'Urban Estate', 'Tripuri', 'Rajpura Road'] },
      { name: 'Mohali', areas: ['Phase 3B2', 'Phase 7', 'Aerocity', 'Sector 68', 'Kharar'] }
    ]
  },
  {
    state: 'Haryana',
    cities: [
      { name: 'Gurugram', areas: ['DLF Phase 1', 'Sohna Road', 'Golf Course Road', 'Sector 56', 'Sector 29', 'Udyog Vihar'] },
      { name: 'Faridabad', areas: ['NIT', 'Sector 15', 'Ballabhgarh', 'Greenfield Colony'] },
      { name: 'Panipat', areas: ['Model Town', 'Tehsil Camp', 'Huda', 'GT Road'] },
      { name: 'Karnal', areas: ['Sector 13', 'Urban Estate', 'Mugal Canal', 'Kunjpura Road'] },
      { name: 'Hisar', areas: ['Sector 14', 'Urban Estate', 'Model Town', 'Cantt'] }
    ]
  },
  {
    state: 'Bihar',
    cities: [
      { name: 'Patna', areas: ['Boring Road', 'Kankarbagh', 'Danapur', 'Bailey Road', 'Rajendra Nagar'] },
      { name: 'Gaya', areas: ['AP Colony', 'Civil Lines', 'Delha', 'Bodh Gaya Road'] },
      { name: 'Muzaffarpur', areas: ['Mithanpura', 'Aghoria Bazar', 'Kalambagh Road', 'Brahmpura'] },
      { name: 'Bhagalpur', areas: ['Tilkamanjhi', 'Barari', 'Khalifabagh', 'Adampur'] },
      { name: 'Darbhanga', areas: ['Laheriasarai', 'Benta', 'Donar', 'Mabbi'] },
      { name: 'Purnea', areas: ['Madhubani', 'Line Bazar', 'Bhattabazar', 'Rambagh'] },
      { name: 'Arrah', areas: ['Nawada', 'Pakri', 'Babu Bazar', 'Station Road'] }
    ]
  },
  {
    state: 'Odisha',
    cities: [
      { name: 'Bhubaneswar', areas: ['Patia', 'Khandagiri', 'Saheed Nagar', 'Nayapalli', 'Chandrasekharpur'] },
      { name: 'Cuttack', areas: ['Badambadi', 'Link Road', 'Mangalabag', 'College Square'] },
      { name: 'Rourkela', areas: ['Civil Township', 'Udit Nagar', 'Chhend', 'Panposh'] },
      { name: 'Puri', areas: ['Baliapanda', 'Grand Road', 'VIP Road', 'Station Road'] },
      { name: 'Berhampur', areas: ['Annapurna Market', 'Aska Road', 'Gosaninuagaon', 'Lanji Palli'] }
    ]
  },
  {
    state: 'Jharkhand',
    cities: [
      { name: 'Ranchi', areas: ['Harmu', 'Lalpur', 'Morabadi', 'Kanke Road', 'Doranda'] },
      { name: 'Jamshedpur', areas: ['Sakchi', 'Bistupur', 'Mango', 'Kadma', 'Sonari'] },
      { name: 'Dhanbad', areas: ['Bank More', 'Saraidhela', 'Bartand', 'Hirapur'] },
      { name: 'Bokaro', areas: ['Sector 4', 'Chas', 'Sector 12', 'Cooperative Colony'] },
      { name: 'Deoghar', areas: ['Castairs Town', 'Bampass Town', 'Jasidih Road', 'Williams Town'] }
    ]
  },
  {
    state: 'Assam',
    cities: [
      { name: 'Guwahati', areas: ['GS Road', 'Dispur', 'Beltola', 'Khanapara', 'Zoo Road'] },
      { name: 'Silchar', areas: ['Tarapur', 'Rangirkhari', 'Ambicapatty', 'Meherpur'] },
      { name: 'Dibrugarh', areas: ['Chowkidingee', 'Mancotta Road', 'Jhalukpara', 'Graham Bazar'] },
      { name: 'Jorhat', areas: ['AT Road', 'Tarajan', 'Borbheta', 'Gar-Ali'] },
      { name: 'Tezpur', areas: ['Parowa', 'Mission Chariali', 'Ketekibari', 'Mahabhairab'] }
    ]
  },
  {
    state: 'Uttarakhand',
    cities: [
      { name: 'Dehradun', areas: ['Rajpur Road', 'Ballupur', 'Prem Nagar', 'Sahastradhara Road', 'Jakhan'] },
      { name: 'Haridwar', areas: ['Ranipur', 'Jwalapur', 'Kankhal', 'BHEL Township'] },
      { name: 'Rishikesh', areas: ['Tapovan', 'Muni Ki Reti', 'IDPL', 'Laxman Jhula'] },
      { name: 'Haldwani', areas: ['Kathgodam', 'Mukhani', 'Heera Nagar', 'Kaladhungi Road'] },
      { name: 'Roorkee', areas: ['Civil Lines', 'Ram Nagar', 'Ganeshpur', 'IIT Roorkee Area'] }
    ]
  },
  {
    state: 'Himachal Pradesh',
    cities: [
      { name: 'Shimla', areas: ['Mall Road', 'Sanjauli', 'New Shimla', 'Chotta Shimla'] },
      { name: 'Dharamshala', areas: ['McLeod Ganj', 'Kotwali Bazaar', 'Sidhpur', 'Yol'] },
      { name: 'Solan', areas: ['Chambaghat', 'Saproon', 'Mall Road', 'Kotlanala'] },
      { name: 'Mandi', areas: ['Indira Market', 'Tarna', 'Sunder Nagar Road', 'Hospital Road'] },
      { name: 'Kullu', areas: ['Dhalpur', 'Akhara Bazaar', 'Bajaura', 'Sultanpur'] }
    ]
  },
  {
    state: 'Chhattisgarh',
    cities: [
      { name: 'Raipur', areas: ['Shankar Nagar', 'Telibandha', 'Pandri', 'Devendra Nagar', 'VIP Road'] },
      { name: 'Bhilai', areas: ['Supela', 'Smriti Nagar', 'Nehru Nagar', 'Civic Centre'] },
      { name: 'Bilaspur', areas: ['Mangla', 'Sarkanda', 'Rajkishore Nagar', 'Vyapar Vihar'] },
      { name: 'Korba', areas: ['Power House Road', 'Transport Nagar', 'Niharika', 'Kosabadi'] },
      { name: 'Durg', areas: ['Padmanabhpur', 'Borsi', 'Station Road', 'Shankar Nagar'] }
    ]
  },
  {
    state: 'Goa',
    cities: [
      { name: 'Panaji', areas: ['Miramar', 'Campal', 'St Inez', 'Altinho'] },
      { name: 'Margao', areas: ['Aquem', 'Fatorda', 'Navelim', 'Borda'] },
      { name: 'Vasco da Gama', areas: ['Chicalim', 'Dabolim', 'Sada', 'Baina'] },
      { name: 'Mapusa', areas: ['Angod', 'Karaswada', 'Peddem', 'Guirim'] }
    ]
  },
  {
    state: 'Jammu and Kashmir',
    cities: [
      { name: 'Srinagar', areas: ['Lal Chowk', 'Rajbagh', 'Hazratbal', 'Bemina', 'Hyderpora'] },
      { name: 'Jammu', areas: ['Gandhi Nagar', 'Trikuta Nagar', 'Talab Tillo', 'Bakshi Nagar'] },
      { name: 'Anantnag', areas: ['Lal Chowk', 'Ashajipora', 'Janglat Mandi', 'Mattan'] },
      { name: 'Baramulla', areas: ['Kanispora', 'Delina', 'Khawajabagh', 'Old Town'] }
    ]
  },
  {
    state: 'Ladakh',
    cities: [
      { name: 'Leh', areas: ['Main Bazaar', 'Skara', 'Choglamsar', 'Housing Colony'] },
      { name: 'Kargil', areas: ['Baroo', 'Titichumik', 'Lankore', 'Biamathang'] }
    ]
  },
  {
    state: 'Chandigarh',
    cities: [
      { name: 'Chandigarh', areas: ['Sector 17', 'Sector 22', 'Manimajra', 'IT Park', 'Sector 35', 'Sector 43'] }
    ]
  },
  {
    state: 'Puducherry',
    cities: [
      { name: 'Puducherry', areas: ['White Town', 'Lawspet', 'Reddiarpalayam', 'Muthialpet'] },
      { name: 'Karaikal', areas: ['Beach Road', 'Nehru Nagar', 'Akkaraivattam', 'Kovilpathu'] }
    ]
  },
  {
    state: 'Tripura',
    cities: [
      { name: 'Agartala', areas: ['Battala', 'Dhaleswar', 'Arundhutinagar', 'Kunjaban'] },
      { name: 'Udaipur', areas: ['Matarbari Road', 'Ramesh Chowmuhani', 'Rajarbag'] }
    ]
  },
  {
    state: 'Sikkim',
    cities: [
      { name: 'Gangtok', areas: ['MG Marg', 'Tadong', 'Deorali', 'Development Area'] },
      { name: 'Namchi', areas: ['Central Bazaar', 'Sikkip', 'Helipad Area', 'Jorethang Road'] }
    ]
  },
  {
    state: 'Manipur',
    cities: [
      { name: 'Imphal', areas: ['Thangal Bazar', 'Paona Bazar', 'Lamphel', 'Singjamei'] },
      { name: 'Thoubal', areas: ['Yairipok Road', 'Wangkhem', 'Lilong', 'Heirok'] }
    ]
  },
  {
    state: 'Meghalaya',
    cities: [
      { name: 'Shillong', areas: ['Police Bazar', 'Laitumkhrah', 'Mawlai', 'Nongthymmai'] },
      { name: 'Tura', areas: ['Araimile', 'Dakopgre', 'Hawakhana', 'Matchakolgre'] }
    ]
  },
  {
    state: 'Nagaland',
    cities: [
      { name: 'Kohima', areas: ['PR Hill', 'New Market', 'Lerie', 'Meriema'] },
      { name: 'Dimapur', areas: ['Duncan Basti', 'Midland', 'Naharbari', 'Purana Bazaar'] }
    ]
  },
  {
    state: 'Mizoram',
    cities: [
      { name: 'Aizawl', areas: ['Bawngkawn', 'Chanmari', 'Zarkawt', 'Dawrpui'] },
      { name: 'Lunglei', areas: ['Theiriat', 'Ramthar', 'Bazar Veng', 'Serkawn'] }
    ]
  },
  {
    state: 'Arunachal Pradesh',
    cities: [
      { name: 'Itanagar', areas: ['Naharlagun', 'Ganga', 'Doimukh', 'ESS Sector'] },
      { name: 'Tawang', areas: ['Old Market', 'Cona', 'Shyo', 'New Tawang'] }
    ]
  },
  {
    state: 'Andaman and Nicobar Islands',
    cities: [
      { name: 'Port Blair', areas: ['Aberdeen Bazaar', 'Junglighat', 'Delanipur', 'Dollygunj'] }
    ]
  },
  {
    state: 'Dadra and Nagar Haveli and Daman and Diu',
    cities: [
      { name: 'Daman', areas: ['Nani Daman', 'Moti Daman', 'Kadaiya', 'Marwad'] },
      { name: 'Silvassa', areas: ['Amli', 'Tokarkhada', 'Kilvani Road', 'Naroli'] },
      { name: 'Diu', areas: ['Nagoa', 'Fudam', 'Vanakbara', 'Ghoghla'] }
    ]
  },
  {
    state: 'Lakshadweep',
    cities: [
      { name: 'Kavaratti', areas: ['Main Jetty Road', 'Ujra', 'East Side', 'North End'] }
    ]
  }
];

export const DEFAULT_LOCATION = {
  state: 'Uttar Pradesh',
  city: 'Kanpur',
  area: 'Swaroop Nagar'
};

const sortAlpha = (items = []) => {
  return [...items].sort((a, b) =>
    String(a).localeCompare(String(b), 'en-IN', { sensitivity: 'base', numeric: true })
  );
};

export const STATE_OPTIONS = sortAlpha(LOCATION_DIRECTORY.map((entry) => entry.state));

export const getCitiesByState = (state) => {
  const match = LOCATION_DIRECTORY.find((entry) => entry.state === state);
  return match ? sortAlpha(match.cities.map((city) => city.name)) : [];
};

export const getAreasByCity = (state, city) => {
  const stateMatch = LOCATION_DIRECTORY.find((entry) => entry.state === state);
  const cityMatch = stateMatch?.cities.find((entry) => entry.name === city);
  return sortAlpha(cityMatch?.areas || []);
};

export const INDIA_LOCATION_SUGGESTIONS = LOCATION_DIRECTORY.flatMap(({ state, cities }) =>
  cities.flatMap(({ name, areas }) => [
    ...areas.map((area) => `${area}, ${name}, ${state}`),
    `${name}, ${state}`,
  ])
);

export const filterIndiaLocations = (query, limit = 12) => {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return [];

  return INDIA_LOCATION_SUGGESTIONS.filter((location) => location.toLowerCase().includes(normalizedQuery)).slice(0, limit);
};

export default LOCATION_DIRECTORY;
