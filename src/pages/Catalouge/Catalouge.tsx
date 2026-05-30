import { Card, Image, Spin, Empty, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCatalogueApi, updateCatalogueOrder } from "../../api/catalogueApi";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const { Meta } = Card;
const { Title } = Typography;

interface CatalogueItem {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
}

// 🔁 Sortable wrapper around each card
const SortableCard = ({ item }: { item: CatalogueItem }) => {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        hoverable
        className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-xl"
        cover={
          <div className="relative overflow-hidden w-full aspect-square bg-gray-100">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat group-hover:scale-105 transition-transform duration-300"
              style={{ 
                backgroundImage: `url(${item.image || 'https://placehold.co/512x512?text=No+Image'})`,
                backgroundSize: 'cover'
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 z-10" />
          </div>
        }
        onClick={() => navigate(`/catalogue/${item.id}`, { state: item })}
        bodyStyle={{ padding: "16px" }}
      >
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-1">
              {item.name}
            </h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold text-green-600">
                {formatPrice(item.price)}
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {item.description}
          </p>
          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs text-blue-600 font-medium hover:text-blue-700 cursor-pointer">
              View Details →
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Catalogue = () => {
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalogueItems();
  }, []);

  const fetchCatalogueItems = async () => {
    try {
      setLoading(true);
      let items = await getCatalogueApi();
      items.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
      console.log("Catalogues", items);
      setCatalogueItems(items);
    } catch (error) {
      console.error("Failed to fetch catalogue items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async ({ active, over }: any) => {
    if (!over || active.id === over.id) return;

    const oldIndex = catalogueItems.findIndex((item) => item.id === active.id);
    const newIndex = catalogueItems.findIndex((item) => item.id === over.id);

    const reorderedItems = arrayMove(catalogueItems, oldIndex, newIndex);
    setCatalogueItems(reorderedItems);

    const payload = reorderedItems.map((item, index) => ({
      itemId: item.id,
      newOrderIndex: index,
    }));
    console.log("Updating order with payload:", payload);

    try {
      await updateCatalogueOrder(payload);
    } catch (error) {
      console.error("Failed to update catalogue order:", error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    })
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Title level={1} className="!text-gray-800 !mb-2">
              Catalogue
            </Title>
          </div>
          <div className="flex justify-center items-center h-64">
            <Spin className="custom-spin-dark" size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Title level={1} className="!text-gray-800 !mb-2">
            Catalogue
          </Title>
        </div>

        {catalogueItems.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-500">No catalogue items found</span>
              }
            />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={catalogueItems}
              strategy={horizontalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {catalogueItems.map((item) => (
                  <SortableCard key={item.id} item={item} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default Catalogue;
