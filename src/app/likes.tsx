import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, EmptyState } from '../components/bits';
import { Header, Wrap } from '../components/Page';
import { ProductGrid } from '../components/ProductGrid';
import { Product, getProduct } from '../data/catalog';
import { useShop } from '../store/useShop';
import { t } from '../i18n';

export default function Likes() {
  const likes = useShop((s) => s.likes);
  const products = useMemo(() => likes.map(getProduct).filter((p): p is Product => !!p), [likes]);
  return (
    <View style={{ flex: 1 }}>
      <Header title={t("My Likes")} cart />
      <ScrollView>
        <Wrap>
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <EmptyState
              icon="heart-outline"
              title={t("No likes yet")}
              subtitle={t("Tap the heart on any product to save it here.")}
              action={<Button title={t("Discover products")} onPress={() => router.navigate('/')} style={{ width: 200 }} />}
            />
          )}
        </Wrap>
      </ScrollView>
    </View>
  );
}
