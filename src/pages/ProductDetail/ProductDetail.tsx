import { useLocation, useNavigate } from "react-router-dom";
import { Button, Image, Typography, Card, Divider } from "antd";
import { useEffect } from "react";
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  TagOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface ProductItem {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
}

const ProductDetail = () => {
  const location = useLocation();
  const product: ProductItem = location.state;
  const navigate = useNavigate();

  if (!product) {
    navigate("/catalogue");
    return null;
  }

  useEffect(() => {
    console.log("Product", product);
  }, []);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  const handleBack = () => {
    navigate("/catalogue");
  };

  const handleCallNow = () => {
    // You can implement actual phone calling logic here
    window.open("tel:+1234567890", "_self");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-blue-600 font-medium"
          >
            Back to Catalogue
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <Card className="border-0 rounded-2xl overflow-hidden shadow-lg [&_.ant-card-body]:!p-0"
            >
              <Image
                src={product.image}
                alt={product.name}
                className="w-full !block h-96 object-cover"
                fallback="https://placehold.co/600x400?text=No+Image"
              />
            </Card>
          </div>

          {/* Product Info Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <Title level={1} className="!text-gray-800 !mb-2">
                    {product.name}
                  </Title>
                  <div className="flex items-center space-x-2">
                    <TagOutlined className="text-green-600" />
                    <span className="text-3xl font-bold text-green-600">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>

                <Divider />

                {/* Description */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <InfoCircleOutlined className="text-blue-600" />
                    <Title level={4} className="!text-gray-700 !mb-0">
                      Product Description
                    </Title>
                  </div>
                  <Paragraph className="text-gray-600 text-base leading-relaxed">
                    {product.description}
                  </Paragraph>
                </div>

                <Divider />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    type="primary"
                    size="large"
                    icon={<PhoneOutlined />}
                    onClick={handleCallNow}
                    className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Call Now
                  </Button>

                  <Button
                    size="large"
                    onClick={handleBack}
                    className="w-full h-12 text-lg font-medium rounded-lg border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                  >
                    Continue Shopping
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <InfoCircleOutlined className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Need more information?
                      </p>
                      <p className="text-sm text-blue-600">
                        Our team is available to help you with product details
                        and pricing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Product Features or Related Info (Optional) */}
        {/* <div className="mt-8">
          <Card className="border-0 shadow-lg">
            <Title level={3} className="!text-gray-800 !mb-4">
              Product Information
            </Title>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🚚</div>
                <h4 className="font-semibold text-gray-700 mb-1">Fast Delivery</h4>
                <p className="text-sm text-gray-600">Quick and reliable shipping</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">💯</div>
                <h4 className="font-semibold text-gray-700 mb-1">Quality Assured</h4>
                <p className="text-sm text-gray-600">Premium quality products</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔧</div>
                <h4 className="font-semibold text-gray-700 mb-1">Support</h4>
                <p className="text-sm text-gray-600">24/7 customer support</p>
              </div>
            </div>
          </Card>
        </div> */}
      </div>
    </div>
  );
};

export default ProductDetail;
