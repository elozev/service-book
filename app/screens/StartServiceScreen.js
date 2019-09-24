import React, { useReducer } from 'react';
import {
  View,
  Text,
  Button
} from 'react-native';
import Spinner from 'react-native-spinkit';
import styles from './../constants/Styles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import Divider from 'react-native-divider';
import { TextField } from 'react-native-material-textfield';
import Fetcher from '../utils/Fetcher';

function reducer(state, action) {
  switch (action.type) {
    case 'submit':
      return {
        ...state,
        isLoading: true,
      }
    case 'success':
      return {
        ...state,
        isLoading: false,
      }
    case 'fail':
      return {
        ...state,
        isLoading: false,
      }
    case 'cancel':
      return {
        ...state,
        isLoading: false,
      }
    case 'license':
      return {
        ...state,
        licensePlate: action.value.toUpperCase(),
      }
    case 'info':
      return {
        ...state,
        infoText: action.value,
      }
  }
}

const initialState = {
  licensePlate: '',
  infoText: 'Натисни бутона, за да започнеш сканирането.',
  isLoading: false,
}



export default function StartServiceScreen(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isLoading, licensePlate, infoText } = state;

  const startService = () => {
    dispatch({ type: 'submit' });
    Fetcher.PUTsession()
      .then(res => {
        if (res.status === 200) {
          dispatch({
            type: 'info',
            value: 'Системата обработва регистрационния номер',
          });

          checkForNewLicensePlate(500);
        } else {
          dispatch({
            type: 'info',
            value: 'Проблем със сървъра! Код ' + res.status,
          })
        }
      })
      .catch(e => {
        console.log(e);
      })
  }

  const checkForNewLicensePlate = (timeout) => {
    setTimeout(() => {
      Fetcher.GETsession()
        .then(res => {
          if (res.status === 200) {
            res.json()
              .then(body => {
                if (!body.is_license_plate_required) {
                  dispatch({
                    type: 'license',
                    value: body.license_plate
                  });
                } else {
                  checkForNewLicensePlate(timeout);
                }
              })
          } else {
            dispatch({
              type: 'info',
              value: 'Проблем със сървъра! Код ' + res.status,
            })
          }
        })
        .catch(e => {
          console.log(e);
        })
    }, timeout);
  }

  return (
    <>
      <View style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Започни обслужване</Text>
          </View>

          <View style={styles.fieldsContainer}>
            {!isLoading ?
              (
                <Button
                  title='Сканирай За Номер'
                  color='purple'
                  accessibilityLabel='Започни обслужване'
                  onPress={startService}
                />
              ) : (
                <View style={styles.alignItemsCenter}>
                  <Spinner
                    isVisisble={true}
                    color='purple'
                    size={30}
                    type={'Bounce'}
                  />
                </View>
              )}
            <View style={styles.alignItemsCenter}>
              <Text>{infoText}</Text>
            </View>

            <Divider
              style={styles.dividerStartService}
              borderColor='black'
              color='black'
              orientation='center'
            >
              ИЛИ
            </Divider>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Въведи ръчно</Text>
            </View>
            <TextField
              label='Регистрационен номер'
              value={licensePlate}
              onChangeText={(text) => {
                dispatch({
                  type: 'license',
                  value: text
                })
              }}
            />
            <Button
              title='Започни обслужване'
              color='purple'
              accessibilityLabel='Започни обслужване'
              onPress={() => startService}
            />

            {/* Invisible Content */}

          </View>
        </KeyboardAwareScrollView>
      </View>
    </>
  )
}