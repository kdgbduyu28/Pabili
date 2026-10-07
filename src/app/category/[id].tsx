import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { Browse } from '../../components/Browse';
import { Header } from '../../components/Page';
import { PRODUCTS, getCategory } from '../../data/catalog';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cat = getCategory(id);
  const products = useMemo(() => PRODUCTS.filter((p) => p.categoryId === id), [id]);
  return (
    <View style={{ flex: 1 }}>
      <Header title={cat?.name ?? 'Category'} cart />
      <Browse products={products} />
    </View>
  );
}
