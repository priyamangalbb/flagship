import React, { Component } from 'react';

import {
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { get } from 'lodash-es';

import { SearchBar } from '@brandingbrand/fscomponents';

import PSScreenWrapper from '../components/PSScreenWrapper';
import PSWelcome from '../components/PSWelcome';
import PSHeroCarousel, {
  PSHeroCarouselItem
} from '../components/PSHeroCarousel';
import PSButton from '../components/PSButton';
import PSShopLandingCategories from '../components/PSShopLandingCategories';

import { openSignInModal } from '../lib/shortcuts';
import { handleDeeplink } from '../lib/deeplinkHandler';
import GlobalStyle from '../styles/Global';
import { border, color, palette } from '../styles/variables';
import { navBarFullBleed } from '../styles/Navigation';
import { NavigatorStyle, ScreenProps } from '../lib/commonTypes';
import withAccount, { AccountProps } from '../providers/accountProvider';
import withTopCategory, { TopCategoryProps } from '../providers/topCategoryProvider';
import { dataSourceConfig } from '../lib/datasource';
import translate, { translationKeys } from '../lib/translations';

const arrow = require('../../assets/images/arrow.png');
const logo = require('../../assets/images/pirateship-120.png');
const searchIcon = require('../../assets/images/search.png');

const ShopStyle = StyleSheet.create({
  arrow: {
    maxWidth: 15,
    maxHeight: 15,
    marginHorizontal: 10,
    transform: [{ rotate: '180deg' }]
  },
  wrapper: {
    backgroundColor: palette.primary
  },
  container: {
    backgroundColor: palette.background,
    flex: 1
  },
  heroCarousel: {},
  welcome: {
    padding: 15
  },
  productCarousel: {
    marginBottom: 20
  },
  scrollView: {
    backgroundColor: palette.background
  },
  shopButtonsContainer: {
    marginBottom: 15,
    marginHorizontal: 15
  },
  shopCategoryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0
  },
  searchBarContainer: {
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  sectionTitle: {
    marginHorizontal: 15,
    marginTop: 0,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'center'
  },
  shopLandingCategories: {
    borderTopWidth: 1,
    borderTopColor: border.color,
    marginBottom: 20
  },
  buttonCategoryLeft: {
    flex: 1
  },
  buttonCategoryRight: {
    flex: 1,
    marginLeft: 5
  },
  topCategoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  viewAllButtonTitle: {
    fontSize: 16,
    color: color.black
  },
  viewAllButton: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
});

export interface ShopProps extends ScreenProps, AccountProps, TopCategoryProps {}

class Shop extends Component<ShopProps> {
  static navigatorStyle: NavigatorStyle = navBarFullBleed;

  constructor(props: ShopProps) {
    super(props);

    Linking.getInitialURL()
      .then(url => {
        if (url) {
          handleDeeplink(url, props.navigator);
        }
      })
      .catch(err => {
        console.warn('Deeplinking error', err);
      });

    Linking.addEventListener('url', event => {
      handleDeeplink(event.url, props.navigator);
    });

    // Listen for navigator events
    this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));

    // Add Keyboard listeners to hide tab bar on Android while the keyboard is open.
    // This is global and doesn't need to be added to the other tabs/screens.
    if (Platform.OS !== 'ios') {
      Keyboard.addListener('keyboardDidShow', () => {
        props.navigator.toggleTabs({
          to: 'hidden',
          animated: false
        });
      });

      Keyboard.addListener('keyboardDidHide', () => {
        props.navigator.toggleTabs({
          to: 'shown',
          animated: false
        });
      });
    }
  }

  onNavigatorEvent(event: any): void {
    if (event.type === 'DeepLink') {
      const parts = event.link.split('/');
      if (parts[0] === 'shop') {
        let navAction: any = {
          screen: null
        };

        if (parts[1] === 'product') {
          // navigate to product
          navAction = {
            screen: 'ProductDetail',
            passProps: {
              productId: parts[2]
            }
          };
        }

        if (navAction.screen) {
          // switch to shop tab if it's not already visible
          this.props.navigator.screenIsCurrentlyVisible()
            .then(visible => {
              if (!visible) {
                this.props.navigator.switchToTab();
              }
              this.props.navigator.push(navAction);
            })
            .catch(e => null);
        }
      }
    }
  }

  handleCategoryItemPress = (item: any) => {
    // Shopify doesn't have the concept of subcategories so always direct users to product index
    const screen = dataSourceConfig.type === 'shopify' ? 'ProductIndex' : 'Category';

    this.props.navigator.push({
      screen,
      title: item.title,
      passProps: {
        categoryId: item.id,
        format: dataSourceConfig.categoryFormat
      }
    });
  }

  render(): JSX.Element {
    return (
      <PSScreenWrapper
        needInSafeArea={true}
        style={ShopStyle.wrapper}
        scrollViewProps={{ style: ShopStyle.scrollView }}
      >
        <View style={ShopStyle.container}>
          <PSWelcome
            logo={logo}
            userName={get(this.props, 'account.store.firstName')}
            isLoggedIn={get(this.props, 'account.isLoggedIn')}
            style={ShopStyle.welcome}
            onSignInPress={openSignInModal(this.props.navigator)}
            onSignOutPress={this.handleSignOut}
          />
          <PSHeroCarousel
            style={ShopStyle.heroCarousel}
            cmsGroup='Shop'
            cmsSlot='Hero-Carousel'
            onItemPress={this.handleHeroCarouselPress}
          />
          <View style={ShopStyle.searchBarContainer}>
            <SearchBar
              containerStyle={GlobalStyle.searchBarInner}
              inputTextStyle={GlobalStyle.searchBarInputTextStyle}
              searchIcon={searchIcon}
              placeholder={translate.string(translationKeys.search.placeholder)}
            />
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={this.showSearchScreen}
            >
              <View />
            </TouchableOpacity>
          </View>

          {this.renderShopButtons()}

          <View style={ShopStyle.topCategoriesContainer}>
            <Text style={[GlobalStyle.h2, ShopStyle.sectionTitle]}>
              {translate.string(translationKeys.screens.shop.shopAllBtn)}
            </Text>
            <PSButton
              link
              title={translate.string(translationKeys.screens.shop.viewAllBtn)}
              onPress={this.goToAllCategories}
              icon={arrow}
              iconStyle={ShopStyle.arrow}
              style={ShopStyle.container}
              titleStyle={ShopStyle.viewAllButtonTitle}
              viewStyle={ShopStyle.viewAllButton}
            />
          </View>
          <PSShopLandingCategories
            categories={get(this.props, 'topCategory.categories')}
            style={ShopStyle.shopLandingCategories}
            onItemPress={this.handleCategoryItemPress}
          />
        </View>
      </PSScreenWrapper>
    );
  }

  renderShopButtons = () => {
    return (
      <View style={ShopStyle.shopButtonsContainer}>
        <View style={ShopStyle.shopCategoryButtonsContainer}>
          <PSButton
            style={ShopStyle.buttonCategoryLeft}
            title={translate.string(translationKeys.screens.shop.shopByCategoryBtn)}
            onPress={this.goToAllCategories}
          />
        </View>
      </View>
    );
  }

  handleHeroCarouselPress = (item: PSHeroCarouselItem) => {
    if (item.Link) {
      handleDeeplink(item.Link, this.props.navigator);
    }
  }

  handleSignOut = () => {
    this.props.signOut().catch(e => console.warn(e));
  }

  goToAllCategories = () => {
    this.props.navigator.push({
      screen: 'Category',
      title: translate.string(translationKeys.screens.allCategories.title),
      passProps: {
        categoryId: '',
        format: 'list'
      }
    });
  }

  showSearchScreen = () => {
    this.props.navigator.push({
      screen: 'Search',
      animated: false,
      passProps: {
        onCancel: () => {
          this.props.navigator.pop({ animated: false });
        }
      }
    });
  }
}

export default withAccount(withTopCategory(Shop));
