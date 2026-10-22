-- Seed 12 Zodiac Signs Master Data
INSERT INTO `zodiac_signs` (`id`, `name`, `symbol`, `element`, `modality`, `ruling_planet`, `date_range`, `traits`) VALUES
(1, 'Aries', '♈', 'Fire', 'Cardinal', 'Mars', 'Mar 21 - Apr 19', 'Courageous, determined, confident, enthusiastic'),
(2, 'Taurus', '♉', 'Earth', 'Fixed', 'Venus', 'Apr 20 - May 20', 'Reliable, patient, practical, devoted'),
(3, 'Gemini', '♊', 'Air', 'Mutable', 'Mercury', 'May 21 - Jun 20', 'Gentle, affectionate, curious, adaptable'),
(4, 'Cancer', '♋', 'Water', 'Cardinal', 'Moon', 'Jun 21 - Jul 22', 'Tenacious, highly imaginative, loyal, emotional'),
(5, 'Leo', '♌', 'Fire', 'Fixed', 'Sun', 'Jul 23 - Aug 22', 'Creative, passionate, generous, warm-hearted'),
(6, 'Virgo', '♍', 'Earth', 'Mutable', 'Mercury', 'Aug 23 - Sep 22', 'Analytical, kind, hardworking, practical'),
(7, 'Libra', '♎', 'Air', 'Cardinal', 'Venus', 'Sep 23 - Oct 22', 'Cooperative, diplomatic, gracious, fair-minded'),
(8, 'Scorpio', '♏', 'Water', 'Fixed', 'Pluto / Mars', 'Oct 23 - Nov 21', 'Resourceful, powerful, brave, passionate'),
(9, 'Sagittarius', '♐', 'Fire', 'Mutable', 'Jupiter', 'Nov 22 - Dec 21', 'Generous, idealistic, great sense of humor'),
(10, 'Capricorn', '♑', 'Earth', 'Cardinal', 'Saturn', 'Dec 22 - Jan 19', 'Responsible, disciplined, self-control'),
(11, 'Aquarius', '♒', 'Air', 'Fixed', 'Uranus / Saturn', 'Jan 20 - Feb 18', 'Progressive, original, independent, humanitarian'),
(12, 'Pisces', '♓', 'Water', 'Mutable', 'Neptune / Jupiter', 'Feb 19 - Mar 20', 'Compassionate, artistic, intuitive, gentle')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Seed Initial C.A.M. Members imported from members.csv
INSERT INTO `members` (`full_name`, `email`, `phone`, `gender_identity`, `zodiac_sign_id`, `zodiac_sign_name`, `club_status`) VALUES
('Momo Samuel', 'theCodingShaman@gmail.com', '(929) 389-7608', 'NB/F', 6, 'Virgo', 'officer'),
('Cam', NULL, NULL, 'NB/M', 5, 'Leo', 'officer'),
('Mimi', NULL, NULL, 'F', 11, 'Aquarius', 'active'),
('Charlie Huerrera', NULL, NULL, 'M', 8, 'Scorpio', 'active');
