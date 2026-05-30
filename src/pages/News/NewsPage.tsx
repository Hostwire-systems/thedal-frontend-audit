import React from "react";
import { Row, Col, Card, Button } from "antd";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

// Mock Data for different sections
const topStories: NewsItem[] = [
  {
    id: 1,
    title: "Major Election Reforms Introduced",
    description:
      "The government announces sweeping reforms to ensure free and fair elections.",
    imageUrl: "https://via.placeholder.com/600x300?text=Top+Story",
    link: "https://example.com/topstory",
  },
];

const editorsPicks: NewsItem[] = [
  {
    id: 2,
    title: "Youth Turnout Expected to Break Records",
    description:
      "Analysts predict unprecedented involvement of young voters.",
    imageUrl: "https://via.placeholder.com/300x200?text=Pick+1",
    link: "https://example.com/pick1",
  },
  {
    id: 3,
    title: "Women Voters: A Rising Force",
    description:
      "How women voters are influencing policy and election outcomes.",
    imageUrl: "https://via.placeholder.com/300x200?text=Pick+2",
    link: "https://example.com/pick2",
  },
  {
    id: 4,
    title: "Candidates Focus on Rural Outreach",
    description:
      "Campaigns shift focus to rural voters to gain a competitive edge.",
    imageUrl: "https://via.placeholder.com/300x200?text=Pick+3",
    link: "https://example.com/pick3",
  },
];

const localUpdates: NewsItem[] = [
  {
    id: 5,
    title: "New Polling Booths in City Center",
    description: "City center residents get three new polling stations.",
    imageUrl: "https://via.placeholder.com/300x200?text=Local+1",
    link: "https://example.com/local1",
  },
  {
    id: 6,
    title: "Candidates Debate Education Policies",
    description:
      "Local candidates discuss their approaches to improving local schools.",
    imageUrl: "https://via.placeholder.com/300x200?text=Local+2",
    link: "https://example.com/local2",
  },
];

const mainNewsData: NewsItem[] = [
  {
    id: 7,
    title: "Election 2024: Polling Schedules Announced",
    description:
      "The Election Commission has announced the schedule for the upcoming elections.",
    imageUrl: "https://via.placeholder.com/300x200?text=News+1",
    link: "https://example.com/news1",
  },
  {
    id: 8,
    title: "New Booth Setup in Urban Wards",
    description:
      "Authorities have set up new polling booths in urban wards.",
    imageUrl: "https://via.placeholder.com/300x200?text=News+2",
    link: "https://example.com/news2",
  },
  {
    id: 9,
    title: "Voter Awareness Programs Launched",
    description:
      "Officials launch campaigns to encourage higher voter turnout.",
    imageUrl: "https://via.placeholder.com/300x200?text=News+3",
    link: "https://example.com/news3",
  },
  {
    id: 10,
    title: "Youth Participation Increases",
    description:
      "A rise in young voters suggests shifting political landscapes.",
    imageUrl: "https://via.placeholder.com/300x200?text=News+4",
    link: "https://example.com/news4",
  },
  {
    id: 11,
    title: "New Voting Technology Introduced",
    description:
      "Electronic voting machines to be upgraded for accuracy and speed.",
    imageUrl: "https://via.placeholder.com/300x200?text=News+5",
    link: "https://example.com/news5",
  },
  {
    id: 12,
    title: "Candidates Focus on Healthcare",
    description:
      "Parties highlight healthcare plans as a key election issue.",
    imageUrl: "https://via.placeholder.com/300x200?text=News+6",
    link: "https://example.com/news6",
  },
];

const NewsPage: React.FC = () => {
  return (
    <div className="p-6">
      {/* Hero Section */}
      <div
        className="w-full h-[300px] mb-8 rounded-lg overflow-hidden relative flex items-center justify-center"
        style={{
          background: `url('https://via.placeholder.com/1200x400?text=Elections+News+Hero') center/cover no-repeat`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative text-white text-center px-4">
          <h1 className="text-[28px] md:text-[36px] font-bold mb-2">Latest Election News & Insights</h1>
          <p className="text-[16px] md:text-[18px] mb-4">
            Stay updated with breaking news, in-depth analysis, and live updates from across the nation.
          </p>
          <Button type="primary" className="rounded px-6 h-[40px]">
            Discover More
          </Button>
        </div>
      </div>

      {/* Section 1: Top Stories */}
      <div className="mb-10">
        <h2 className="text-[20px] font-semibold mb-4 text-[#1C1C1C]">Top Stories</h2>
        <Row gutter={[16, 16]}>
          {topStories.map((story) => (
            <Col xs={24} key={story.id}>
              <Card
                hoverable
                className="transition-shadow shadow-sm hover:shadow-md rounded-lg flex flex-col md:flex-row"
              >
                <img
                  alt={story.title}
                  src={story.imageUrl}
                  className="rounded-lg w-full md:w-1/2 h-[200px] object-cover mr-0 md:mr-4 mb-4 md:mb-0"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-[16px] text-[#1C1C1C] mb-2">
                    {story.title}
                  </h3>
                  <p className="text-[14px] text-[#1C1C1C] mb-4">
                    {story.description}
                  </p>
                  <Button
                    type="primary"
                    className="rounded px-4 h-[40px]"
                    onClick={() => window.open(story.link, "_blank")}
                  >
                    Read More
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Section 2: Editor's Picks */}
      <div className="mb-10">
        <h2 className="text-[20px] font-semibold mb-4 text-[#1C1C1C]">Editor's Picks</h2>
        <Row gutter={[16, 16]}>
          {editorsPicks.map((news) => (
            <Col xs={24} sm={12} md={8} key={news.id}>
              <Card
                hoverable
                className="transition-shadow shadow-sm hover:shadow-md rounded-lg"
                cover={
                  <img
                    alt={news.title}
                    src={news.imageUrl}
                    className="rounded-t-lg h-[200px] object-cover"
                  />
                }
              >
                <h3 className="font-semibold text-[16px] text-[#1C1C1C] mb-2">
                  {news.title}
                </h3>
                <p className="text-[14px] text-[#1C1C1C] mb-4 line-clamp-3">
                  {news.description}
                </p>
                <Button
                  type="primary"
                  className="rounded px-4 h-[40px]"
                  onClick={() => window.open(news.link, "_blank")}
                >
                  Read More
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Section 3: Local Updates */}
      <div className="mb-10">
        <h2 className="text-[20px] font-semibold mb-4 text-[#1C1C1C]">Local Updates</h2>
        <Row gutter={[16, 16]}>
          {localUpdates.map((news) => (
            <Col xs={24} sm={12} key={news.id}>
              <Card
                hoverable
                className="transition-shadow shadow-sm hover:shadow-md rounded-lg"
                cover={
                  <img
                    alt={news.title}
                    src={news.imageUrl}
                    className="rounded-t-lg h-[200px] object-cover"
                  />
                }
              >
                <h3 className="font-semibold text-[16px] text-[#1C1C1C] mb-2">
                  {news.title}
                </h3>
                <p className="text-[14px] text-[#1C1C1C] mb-4 line-clamp-3">
                  {news.description}
                </p>
                <Button
                  type="primary"
                  className="rounded px-4 h-[40px]"
                  onClick={() => window.open(news.link, "_blank")}
                >
                  Read More
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Main News Listing */}
      <div className="mb-10">
        <h2 className="text-[20px] font-semibold mb-4 text-[#1C1C1C]">More News</h2>
        <Row gutter={[16, 16]}>
          {mainNewsData.map((news) => (
            <Col xs={24} sm={12} md={8} lg={6} key={news.id}>
              <Card
                hoverable
                className="transition-shadow shadow-sm hover:shadow-md rounded-lg"
                cover={
                  <img
                    alt={news.title}
                    src={news.imageUrl}
                    className="rounded-t-lg h-[200px] object-cover"
                  />
                }
              >
                <h3 className="font-semibold text-[16px] text-[#1C1C1C] mb-2">
                  {news.title}
                </h3>
                <p className="text-[14px] text-[#1C1C1C] mb-4 line-clamp-3">
                  {news.description}
                </p>
                <Button
                  type="primary"
                  className="rounded px-4 h-[40px]"
                  onClick={() => window.open(news.link, "_blank")}
                >
                  Read More
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default NewsPage;
